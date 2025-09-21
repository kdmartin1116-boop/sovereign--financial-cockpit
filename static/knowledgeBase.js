export const KNOWLEDGE_BASE = {
    FCRA: {
        summary: "The Fair Credit Reporting Act (FCRA) is a federal law that promotes the accuracy, fairness, and privacy of consumer information contained in the files of consumer reporting agencies.",
        legalBasis: "15 U.S.C. § 1681 et seq.",
        rights: [
            "Right to accuracy and verification (15 U.S.C. § 1681i)",
            "Right to notice of information being furnished (15 U.S.C. § 1681m)",
            "Right to obtain a copy of your file (15 U.S.C. § 1681j)",
            "Right to dispute inaccurate or incomplete information (15 U.S.C. § 1681i)",
            "Right to have outdated information removed (15 U.S.C. § 1681c)",
            "Right to limit prescreened offers (15 U.S.C. § 1681b(e))",
            "Right to obtain a security freeze (15 U.S.C. § 1681c-1)",
            "Right to obtain a fraud alert (15 U.S.C. § 1681c-1)"
        ],
        disputeProcedure: "Consumers can dispute inaccurate information directly with the credit reporting agency (CRA) or the furnisher of the information. The CRA must investigate the dispute free of charge and usually within 30 days.",
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
        summary: "The Fair Debt Collection Practices Act (FDCPA) is a federal law that limits the actions of third-party debt collectors. It prohibits abusive, deceptive, and unfair debt collection practices.",
        legalBasis: "15 U.S.C. § 1692 et seq.",
        rights: [
            "Right to stop communication (15 U.S.C. § 1692c(c))",
            "Right to a validation notice (15 U.S.C. § 1692g)",
            "Protection against harassment or abuse (15 U.S.C. § 1692d)",
            "Protection against false or misleading representations (15 U.S.C. § 1692e)",
            "Protection against unfair practices (15 U.S.C. § 1692f)"
        ],
        prohibitedPractices: [
            "Calling repeatedly or continuously (15 U.S.C. § 1692d(5))",
            "Calling before 8 a.m. or after 9 p.m. local time (15 U.S.C. § 1692c(a)(1))",
            "Contacting you at work if they know your employer prohibits it (15 U.S.C. § 1692c(a)(3))",
            "Threatening to harm you or your property (15 U.S.C. § 1692d(1))",
            "Using obscene or profane language (15 U.S.C. § 1692d(2))",
            "Misrepresenting the amount of debt (15 U.S.C. § 1692e(2)(A))",
            "Falsely implying they are attorneys or government representatives (15 U.S.C. § 1692e(3))",
            "Contacting third parties about your debt (with limited exceptions) (15 U.S.C. § 1692c(b))"
        ],
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
    TILA: {
        summary: "The Truth in Lending Act (TILA) is a federal law designed to promote the informed use of consumer credit by requiring disclosures about its terms and cost. It aims to protect consumers in credit transactions.",
        legalBasis: "15 U.S.C. § 1601 et seq. (Regulation Z)",
        keyDisclosures: [
            "Annual Percentage Rate (APR)",
            "Finance Charge",
            "Amount Financed",
            "Total of Payments",
            "Total Sale Price (for credit sales)"
        ],
        remedies: [
            "Right to Rescission (for certain mortgage transactions)",
            "Statutory Damages (for disclosure violations)",
            "Actual Damages",
            "Attorney's Fees and Court Costs"
        ],
        enforcement: "Enforced by the Consumer Financial Protection Bureau (CFPB) and other federal agencies. Consumers can also sue in federal court."
    },
    UCC: {
        summary: "The Uniform Commercial Code (UCC) is a set of standardized laws governing commercial transactions in the United States. It covers areas like sales, leases, negotiable instruments, and secured transactions.",
        relevance: "Relevant sections for this application include Article 3 (Negotiable Instruments) and Article 9 (Secured Transactions).",
        articles: {
            "Article 3 (Negotiable Instruments)": {
                summary: "Governs promissory notes, drafts (checks), certificates of deposit, and other negotiable instruments.",
                sections: [
                    "UCC § 3-104: Definition of Negotiable Instrument",
                    "UCC § 3-203: Transfer of Instrument; Rights Acquired by Transfer",
                    "UCC § 3-302: Holder in Due Course",
                    "UCC § 3-415: Obligation of Indorser"
                ]
            },
            "Article 9 (Secured Transactions)": {
                summary: "Governs transactions that combine a debt with a creditor's interest in a debtor's personal property (collateral).",
                sections: [
                    "UCC § 9-102: Definitions and Index of Definitions",
                    "UCC § 9-203: Attachment and Enforceability of Security Interest; Proceeds; Supporting Obligations; Formal Requisites",
                    "UCC § 9-301: Law Governing Perfection and Priority of Security Interests",
                    "UCC § 9-601: Rights After Default; Judicial Enforcement; Consignor or Buyer of Accounts, Chattel Paper, Payment Intangibles, or Promissory Notes"
                ]
            }
        }
    },
    DenialReasons: {
        "low_score": {
            summary: "Low Credit Score",
            keywords: ["credit score", "score is too low", "below our minimum requirements"]
        },
        "no_history": {
            summary: "Insufficient Credit History",
            keywords: ["insufficient credit history", "no credit file", "lack of credit history"]
        },
        "high_utilization": {
            summary: "High Credit Utilization",
            keywords: ["high credit utilization", "balances are too high", "proportion of loan balances"]
        },
        "late_payments": {
            summary: "History of Late Payments",
            keywords: ["late payments", "delinquent", "payment history"]
        },
        "too_many_inquiries": {
            summary: "Too Many Recent Inquiries",
            keywords: ["too many inquiries", "excessive applications", "number of inquiries"]
        }
    },
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
};