Directory Structure
paxos-lab/
├── package.json
├── simulator.js          
├── proposal.js           
├── proposer.js           
├── acceptor.js           
├── learner.js              
├── quorum.js             
├── network.js            
├── assumption_failures.js    
└── scenarios/             

Setup & Usage
	Install dependencies:
npm install
	Run the Scenarios
npm run happy          
npm run failure        
npm run proposers      
npm run partial        
npm run preserve       
npm run multi         
npm run partition      
npm run majority-loss  
npm run state-loss     
npm run quorum-error 
npm run hardening
Part 8: Hardening Features Implemented
	Quorum Validation (quorum.js): validateQuorum() prevents unsafe quorum configurations (≤N/2)
	State Integrity Detection (acceptor.js): validateStateIntegrity() detects and contains unexpected state resets (highestPromised === 0 || acceptedProposal === null)
	Majority Health Checks (simulator.js): checkClusterHealth() ensures sufficient online, healthy acceptors for quorum formation
	Proposer Churn Detection (simulator.js): detectProposerInstability() tracks and warns of destabilizing proposer competition
	Protocol Observability (simulator.js): logAudit() creates [AUDIT] logs for proposals, promises, quorum decisions, safety overrides, acceptances, and chosen values
