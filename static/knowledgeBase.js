export const KNOWLEDGE_BASE = {
    FCRA: {
        violations: {
            "inaccurate_account": {
                summary: "Inaccurate Account Information",
                template: "The account information reported is inaccurate. This account is not mine or contains incorrect details."
            },
            "unauthorized_inquiry": {
                summary: "Unauthorized Hard Inquiry",
                template: "An unauthorized hard inquiry appears on my report. I did not authorize this inquiry."
            },
            "outdated_information": {
                summary: "Outdated Information",
                template: "The information reported is outdated and should be removed from my report."
            },
            "mixed_files": {
                summary: "Mixed Files",
                template: "My credit report contains information belonging to another individual."
            },
            "reinserted_information": {
                summary: "Reinserted Information",
                template: "Previously deleted information has been reinserted on my report without proper verification."
            },
            "identity_theft": {
                summary: "Identity Theft",
                template: "This account is the result of identity theft and should be removed."
            }
        }
    },
    FDCPA: {
        violations: {
            "harassment": {
                summary: "Harassment (e.g., repeated calls)",
                keywords: ["call", "harass", "repeated", "annoy"]
            },
            "false_representation": {
                summary: "False Representation (e.g., misrepresenting debt)",
                keywords: ["lie", "false", "misrepresent", "threat"]
            },
            "calling_unusual_times": {
                summary: "Calling at Unusual Times (before 8 AM or after 9 PM)",
                keywords: ["time", "early", "late", "hour"]
            },
            "threatening_illegal_actions": {
                summary: "Threatening Illegal Actions (e.g., arrest, property seizure)",
                keywords: ["threat", "arrest", "seize", "illegal"]
            },
            "contacting_third_parties": {
                summary: "Contacting Third Parties (e.g., employer, family)",
                keywords: ["employer", "family", "friend", "third party"]
            },
            "failing_validation_notice": {
                summary: "Failing to Send Validation Notice",
                keywords: ["validate", "notice", "debt", "verify"]
            }
        }
    },
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
        // UI/UX Recommendation: Ensure the application's user interface clearly highlights the controversial nature
        // and potential legal risks associated with "Accepted for Value" endorsements,
        // perhaps with prominent warnings or requiring explicit user acknowledgment.
        AcceptedForValue: {
            summary: 'Accepted for Value (A4V)',
            detail: 'This is a controversial theory associated with sovereign citizen and redemption movements. It purports to "accept" a bill as value and use it to discharge a debt via a Treasury account. This is not recognized in mainstream commercial law and can carry legal risks.'
        }
    }

    // ... other knowledge base sections ...
};