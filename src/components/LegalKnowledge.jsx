import React, { useState } from 'react';

const LegalKnowledge = () => {
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <>
            <h2>Legal Knowledge</h2>
            <div className="collapsible">
                <button className="collapsible-button" onClick={() => toggleSection('rights')}>
                    Know Your Rights <i className={`fas ${openSection === 'rights' ? 'fa-minus' : 'fa-plus'}`}></i>
                </button>
                <div className="collapsible-content" style={{ maxHeight: openSection === 'rights' ? 'fit-content' : '0px' }}>
                    <p>This guide provides a general overview of fundamental legal rights and principles that every citizen should be aware of. Understanding your rights is the first step towards becoming your own legal advocate.</p>
                    <p><strong>Disclaimer:</strong> This information is for educational purposes only and does not constitute legal advice. The law is complex and varies by jurisdiction. Consult with a qualified legal professional for advice on your specific situation.</p>
                    <h4>1. The Right to Remain Silent</h4>
                    <ul>
                        <li>You have the right to remain silent when questioned by law enforcement. You do not have to answer their questions.</li>
                        <li>You can invoke this right by saying, "I wish to remain silent."</li>
                    </ul>
                    <h4>2. The Right to an Attorney</h4>
                    <ul>
                        <li>You have the right to an attorney. If you cannot afford an attorney, one will be appointed to you in a criminal case.</li>
                        <li>You can invoke this right by saying, "I want an attorney."</li>
                    </ul>
                    <h4>3. The Right to be Free from Unreasonable Searches and Seizures</h4>
                    <ul>
                        <li>The Fourth Amendment protects you from unreasonable searches and seizures by the government.</li>
                        <li>In most cases, law enforcement must have a warrant to search your property.</li>
                    </ul>
                    <h4>4. The Right to Due Process</h4>
                    <ul>
                        <li>The Fifth and Fourteenth Amendments guarantee your right to due process of law.</li>
                        <li>This means that the government must follow fair procedures when it takes action that affects your life, liberty, or property.</li>
                    </ul>
                    <h4>5. The Right to a Fair Trial</h4>
                    <ul>
                        <li>If you are accused of a crime, you have the right to a fair and public trial by an impartial jury.</li>
                    </ul>
                    <h4>6. The Right to Freedom of Speech</h4>
                    <ul>
                        <li>The First Amendment protects your right to freedom of speech, which includes the right to express your opinions and ideas without government censorship.</li>
                    </ul>
                    <p><em>This is not an exhaustive list of your rights. It is important to research the laws in your jurisdiction to fully understand your rights and responsibilities.</em></p>
                </div>
            </div>

            <div className="collapsible">
                <button className="collapsible-button" onClick={() => toggleSection('mistakes')}>Common Legal Mistakes to Avoid <i className={`fas ${openSection === 'mistakes' ? 'fa-minus' : 'fa-plus'}`}></i></button>
                <div className="collapsible-content" style={{ maxHeight: openSection === 'mistakes' ? 'fit-content' : '0px' }}>
                    <p>Navigating the legal system can be challenging. This guide outlines some common mistakes that people make when representing themselves, and how to avoid them.</p>
                    <p><strong>Disclaimer:</strong> This information is for educational purposes only and does not constitute legal advice. Consult with a qualified legal professional for advice on your specific situation.</p>
                    <h4>1. Talking to the Police Without an Attorney</h4>
                    <ul>
                        <li><strong>The Mistake:</strong> Many people believe that if they are innocent, they have nothing to hide and can talk to the police without an attorney. However, anything you say can be used against you in court.</li>
                        <li><strong>How to Avoid It:</strong> Always exercise your right to remain silent and your right to an attorney. Do not answer any questions from law enforcement without an attorney present.</li>
                    </ul>
                    <h4>2. Not Reading Documents Before Signing</h4>
                    <ul>
                        <li><strong>The Mistake:</strong> Signing legal documents without reading and understanding them can have serious consequences.</li>
                        <li><strong>How to Avoid It:</strong> Carefully read every document before you sign it. If you do not understand something, ask for clarification or consult with an attorney.</li>
                    </ul>
                    <h4>3. Missing Deadlines</h4>
                    <ul>
                        <li><strong>The Mistake:</strong> The legal system has strict deadlines for filing documents and taking other actions. Missing a deadline can result in your case being dismissed.</li>
                        <li><strong>How to Avoid It:</strong> Keep a calendar of all important deadlines in your case. File all documents on time.</li>
                    </ul>
                    <h4>4. Not Knowing the Rules of Evidence</h4>
                    <ul>
                        <li><strong>The Mistake:</strong> The rules of evidence govern what information can be presented in court. If you do not know the rules of evidence, you may not be able to present your case effectively.</li>
                        <li><strong>How to Avoid It:</strong> Research the rules of evidence in your jurisdiction. If you are representing yourself, you will be expected to follow the same rules as an attorney.</li>
                    </ul>
                    <h4>5. Getting Emotional in Court</h4>
                    <ul>
                        <li><strong>The Mistake:</strong> It is understandable to be emotional when dealing with a legal issue, but getting emotional in court can hurt your case. It can make you appear less credible to the judge and jury.</li>
                        <li><strong>How to Avoid It:</strong> Stay calm and professional in court. Stick to the facts of your case and avoid making personal attacks.</li>
                    </ul>
                    <h4>6. Not Being Prepared</h4>
                    <ul>
                        <li><strong>The Mistake:</strong> Failing to prepare for a hearing or trial is a recipe for disaster.</li>
                        <li><strong>How to Avoid It:</strong> Prepare a written outline of your arguments and the evidence you will present. Practice your presentation before you go to court.</li>
                    </ul>
                </div>
            </div>

            <div className="collapsible">
                <button className="collapsible-button" onClick={() => toggleSection('glossary')}>Legal Terminology Glossary <i className={`fas ${openSection === 'glossary' ? 'fa-minus' : 'fa-plus'}`}></i></button>
                <div className="collapsible-content" style={{ maxHeight: openSection === 'glossary' ? 'fit-content' : '0px' }}>
                    <p>This glossary provides definitions for common legal terms. Understanding these terms is essential for navigating the legal system.</p>
                    <p><strong>Disclaimer:</strong> This information is for educational purposes only and does not constitute legal advice. The definitions provided here are simplified and may not capture all legal nuances. Consult with a qualified legal professional for advice on your specific situation.</p>
                    <dl>
                        <dt>Affidavit</dt>
                        <dd>A written statement made under oath.</dd>
                        <dt>Appeal</dt>
                        <dd>A request to a higher court to review a lower court's decision.</dd>
                        <dt>Attorney</dt>
                        <dd>A person who is licensed to practice law.</dd>
                        <dt>Civil Case</dt>
                        <dd>A lawsuit that does not involve criminal charges.</dd>
                        <dt>Complaint</dt>
                        <dd>The first document filed in a lawsuit, which outlines the plaintiff's claims against the defendant.</dd>
                        <dt>Contract</dt>
                        <dd>A legally enforceable agreement between two or more parties.</dd>
                        <dt>Criminal Case</dt>
                        <dd>A lawsuit that is brought by the government against a person who is accused of a crime.</dd>
                        <dt>Defendant</dt>
                        <dd>The person who is being sued or accused of a crime.</dd>
                        <dt>Deposition</dt>
                        <dd>The process of giving sworn testimony outside of court.</dd>
                        <dt>Discovery</dt>
                        <dd>The process of gathering evidence from the opposing party in a lawsuit.</dd>
                        <dt>Evidence</dt>
                        <dd>Information that is presented in court to prove a fact.</dd>
                        <dt>Felony</dt>
                        <dd>A serious crime that is punishable by more than one year in prison.</dd>
                        <dt>Jurisdiction</dt>
                        <dd>The authority of a court to hear a case.</dd>
                        <dt>Lawsuit</dt>
                        <dd>A legal action that is brought in a court of law.</dd>
                        <dt>Liability</dt>
                        <dd>Legal responsibility for one's acts or omissions.</dd>
                        <dt>Misdemeanor</dt>
                        <dd>A less serious crime that is punishable by less than one year in jail.</dd>
                        <dt>Motion</dt>
                        <dd>A request to the court for an order.</dd>
                        <dt>Plaintiff</dt>
                        <dd>The person who files a lawsuit.</dd>
                        <dt>Plea Bargain</dt>
                        <dd>An agreement between the prosecutor and the defendant in a criminal case, in which the defendant agrees to plead guilty to a lesser charge in exchange for a more lenient sentence.</dd>
                        <dt>Statute of Limitations</dt>
                        <dd>A law that sets a deadline for filing a lawsuit.</dd>
                        <dt>Subpoena</dt>
                        <dd>A court order that requires a person to appear in court or to produce documents.</dd>
                        <dt>Testimony</dt>
                        <dd>Statements made under oath in a legal proceeding.</dd>
                        <dt>Tort</dt>
                        <dd>A civil wrong that causes harm to another person.</dd>
                        <dt>Verdict</dt>
                        <dd>The decision of a jury in a trial.</dd>
                    </dl>
                </div>
            </div>
        </>
    );
};

export default LegalKnowledge;
