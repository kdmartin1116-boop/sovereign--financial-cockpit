const KNOWLEDGE_BASE = {
    // ... other knowledge base sections like FDCPA, FCRA, etc.

    Endorsements: {
        WithoutRecourse: {
            summary: 'Without Recourse (UCC § 3-415(b))',
            detail: 'This qualifier disclaims the endorser\'s liability to pay the instrument if it is dishonored. The person who takes the instrument cannot sue the endorser if the original maker fails to pay.'
        },
        ForDepositOnly: {
            summary: 'For Deposit Only (UCC § 3-206(c))',
            detail: 'This is a restrictive endorsement. It requires that the instrument be deposited into an account for the endorser. It prevents anyone else from cashing the check or depositing it into another account.'
        },
        UCC_1_308: {
            summary: 'Under Protest / Without Prejudice (UCC § 1-308)',
            detail: 'This indicates that you are performing an action (like cashing a check) but are explicitly reserving your rights to dispute the underlying obligation. You are not agreeing that the payment satisfies the full debt.'
        },
        AcceptedForValue: {
            summary: 'Accepted for Value (A4V)',
            detail: 'This is a controversial theory associated with sovereign citizen and redemption movements. It purports to "accept" a bill as value and use it to discharge a debt via a Treasury account. This is not recognized in mainstream commercial law and can carry legal risks.'
        }
    }

    // ... other knowledge base sections ...
};