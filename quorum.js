class Quorum {

    constructor(size) {
        this.size = size;
    }

    majority() {
        return Math.floor(this.size / 2) + 1;
    }

    
    validateQuorum() {
        const currentMajority = this.majority();
        const safeMajority = Math.floor(this.size / 2) + 1;
        if (currentMajority <= this.size / 2 || currentMajority < safeMajority) {
            console.log(`[SECURITY ALERT] Unsafe quorum configuration detected! Quorum=${currentMajority}, Cluster Size=${this.size}. Overlap not guaranteed.`);
            return false;
        }
        return true;
    }

    reached(count) {
        if (!this.validateQuorum()) {
            return false;
        }
        return count >= this.majority();
    }
}

module.exports = Quorum;