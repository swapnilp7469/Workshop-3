const Quorum = require("./quorum");

class Simulator {

    constructor(proposer, acceptors, learners) {

        this.proposer = proposer;
        this.acceptors = acceptors;
        this.learners = learners;

        this.quorum = new Quorum(acceptors.length);

        
        this.lastProposerId = null;
        this.proposerChurnCount = 0;
        this.auditLog = [];
    }

    
    logAudit(event, details) {
        const entry = `[AUDIT] ${event}: ${JSON.stringify(details)}`;
        this.auditLog.push(entry);
        console.log(entry);
    }

    
    checkClusterHealth() {
        const onlineAcceptors = this.acceptors.filter(a => a.online && a.validateStateIntegrity());
        const required = this.quorum.majority();
        if (onlineAcceptors.length < required) {
            console.log(`[HEALTH CHECK FAILED] Only ${onlineAcceptors.length}/${this.acceptors.length} healthy acceptors available (Quorum requires ${required}). Disabling new proposals.`);
            return false;
        }
        return true;
    }

    
    detectProposerInstability() {
        if (this.lastProposerId && this.lastProposerId !== this.proposer.id) {
            this.proposerChurnCount++;
            if (this.proposerChurnCount >= 1) {
                console.log(`[INSTABILITY WARNING] Proposer switched from ${this.lastProposerId} to ${this.proposer.id} (Churn count: ${this.proposerChurnCount})`);
            }
        }
        this.lastProposerId = this.proposer.id;
    }

    run(value) {

        console.log("\n====================");
        console.log(`Proposal Value = ${value}`);
        console.log("====================");

        console.log(`Acceptors: ${this.acceptors.length}`);
        console.log(`Required Quorum: ${this.quorum.majority()}`);
        console.log("");

        
        if (!this.quorum.validateQuorum()) {
            this.logAudit("ABORTED_UNSAFE_QUORUM", { size: this.acceptors.length, majority: this.quorum.majority() });
            console.log("ABORTED: Unsafe quorum configuration.");
            return;
        }

        
        if (!this.checkClusterHealth()) {
            this.logAudit("ABORTED_MAJORITY_LOSS", { onlineCount: this.acceptors.filter(a => a.online).length });
            return;
        }

        
        this.detectProposerInstability();

        const proposal = this.proposer.nextProposal(value);
        this.logAudit("PROPOSAL_CREATED", { proposer: this.proposer.id, proposalNumber: proposal.number, proposedValue: proposal.value });

        

        const promises = [];

        for (const acceptor of this.acceptors) {

            const response = acceptor.prepare(proposal.number);
            if (response) {
                promises.push(response);
                console.log(`${acceptor.id} PROMISE`);
                this.logAudit("PROMISE_RECEIVED", {
                    acceptor: acceptor.id,
                    proposalNumber: response.proposalNumber,
                    previouslyAccepted: response.accepted
                });
            }
        }

        console.log(`Promises Received: ${promises.length}/${this.acceptors.length}`);

        if (!this.quorum.reached(promises.length)) {
            this.logAudit("QUORUM_FAILED_PROMISES", { received: promises.length, required: this.quorum.majority() });
            console.log("FAILED: no quorum of promises");
            return;
        }

        this.logAudit("PROMISE_QUORUM_FORMED", { count: promises.length, required: this.quorum.majority() });

       

        let highestAccepted = null;

        for (const promise of promises) {

            if (promise.accepted) {
                if (highestAccepted === null) {
                    highestAccepted = promise.accepted;

                } else if (promise.accepted.number > highestAccepted.number) {
                    highestAccepted = promise.accepted;
                }
            }
        }

        if (highestAccepted) {

            console.log("\nPREVIOUSLY ACCEPTED VALUE FOUND");
            console.log(`Proposal ${highestAccepted.number}`);

            console.log(`Value = ${highestAccepted.value}`);

            console.log("Overriding proposer value to preserve safety");

            proposal.value = highestAccepted.value;
            this.logAudit("VALUE_OVERRIDDEN_FOR_SAFETY", { adoptedFromProposal: highestAccepted.number, adoptedValue: proposal.value });
        }

        
        const accepted = [];

        for (const acceptor of this.acceptors) {

            const response = acceptor.accept(proposal);

            if (response) {
                accepted.push(response);
                console.log(`${acceptor.id} ACCEPTED`);
                this.logAudit("PROPOSAL_ACCEPTED", {
                    acceptor: acceptor.id,
                    proposalNumber: proposal.number,
                    acceptedValue: proposal.value
                });
            }
        }

        console.log(`Acceptances Received: ${accepted.length}/${this.acceptors.length}`);

        if (!this.quorum.reached(accepted.length)) {
            this.logAudit("QUORUM_FAILED_ACCEPTS", { received: accepted.length, required: this.quorum.majority() });
            console.log("FAILED: no quorum of accepts");
            return;
        }

        this.logAudit("ACCEPT_QUORUM_FORMED", { count: accepted.length, required: this.quorum.majority() });

        

        console.log(`VALUE CHOSEN: ${proposal.value}`);
        this.logAudit("VALUE_CHOSEN", { proposalNumber: proposal.number, chosenValue: proposal.value });

        for (const learner of this.learners) {
            learner.learn(proposal.value);
        }
    }
}

module.exports = Simulator;