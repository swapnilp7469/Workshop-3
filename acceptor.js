class Acceptor {

    constructor(id) {

        this.id = id;
        this.highestPromised = 0;
        this.acceptedProposal = null;
        this.online = true;

        
        this.hadPromisedHistory = false;
        this.hadAcceptedHistory = false;
    }

    fail() {
        this.online = false;
    }

    recover() {
        this.online = true;
    }

    
    validateStateIntegrity() {
        if (this.hadPromisedHistory && this.highestPromised === 0) {
            console.log(`[SECURITY ALERT] State loss detected on ${this.id}: highestPromised reset to 0!`);
            return false;
        }
        if (this.hadAcceptedHistory && this.acceptedProposal === null) {
            console.log(`[SECURITY ALERT] State loss detected on ${this.id}: acceptedProposal reset to null!`);
            return false;
        }
        return true;
    }

    prepare(number) {

        if (!this.online) {
            console.log(`${this.id} OFFLINE`);
            return null;
        }

        if (!this.validateStateIntegrity()) {
            console.log(`${this.id} QUARANTINED due to state integrity violation`);
            return null;
        }

        if (number > this.highestPromised) {
            this.highestPromised = number;
            this.hadPromisedHistory = true;

            if (this.acceptedProposal) {
                console.log(`${this.id} reports previously accepted:`);
                console.log(`(${this.acceptedProposal.number}, ${this.acceptedProposal.value})`);
            }

            return {
                type: "PROMISE",
                acceptor: this.id,
                proposalNumber: number,
                accepted: this.acceptedProposal
            };
        }

        return null;
    }

    accept(proposal) {

        if (!this.online) {
            console.log(`${this.id} OFFLINE`);
            return null;
        }

        if (!this.validateStateIntegrity()) {
            console.log(`${this.id} QUARANTINED due to state integrity violation`);
            return null;
        }

        if (proposal.number >= this.highestPromised) {
            this.highestPromised = proposal.number;
            this.acceptedProposal = proposal;
            this.hadPromisedHistory = true;
            this.hadAcceptedHistory = true;

            return {
                type: "ACCEPTED",
                acceptor: this.id,
                proposal
            };
        }
        console.log(`${this.id} REJECTED proposal ${proposal.number}`);

        return null;
    }
}

module.exports = Acceptor;