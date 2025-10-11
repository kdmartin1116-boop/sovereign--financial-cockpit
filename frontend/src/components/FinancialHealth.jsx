import React, { useState } from 'react';

const FinancialHealth = () => {
    const [income, setIncome] = useState('');
    const [expenses, setExpenses] = useState('');
    const [result, setResult] = useState('');

    const calculateBudget = () => {
        if (income && expenses) {
            const surplus = parseFloat(income) - parseFloat(expenses);
            if (surplus >= 0) {
                setResult(`<p>Your monthly surplus is: $${surplus.toFixed(2)}</p>`);
            } else {
                setResult(`<p>Your monthly deficit is: $${Math.abs(surplus).toFixed(2)}</p>`);
            }
        } else {
            setResult('<p>Please enter both your income and expenses.</p>');
        }
    };

    return (
        <>
            <h2>Financial Health Checklist</h2>
            <p>This checklist is designed to help you build a strong financial foundation, inspired by the principles of financial coach Brandon Joe Miller. A strong financial foundation is the first step towards achieving financial independence and building generational wealth.</p>
            <p><strong>Disclaimer:</strong> This information is for educational purposes only and does not constitute financial advice. Consult with a qualified financial advisor to discuss your specific situation.</p>
            
            <h3>1. Create a Budget</h3>
            <ul>
                <li><input type="checkbox" /> Track your income and expenses for at least 30 days.</li>
                <li><input type="checkbox" /> Create a monthly budget that allocates your income to your expenses, savings, and debt repayment.</li>
                <li><input type="checkbox" /> Review your budget regularly and make adjustments as needed.</li>
            </ul>

            <h3>2. Build an Emergency Fund</h3>
            <ul>
                <li><input type="checkbox" /> Open a separate savings account for your emergency fund.</li>
                <li><input type="checkbox" /> Start by saving at least $1,000.</li>
                <li><input type="checkbox" /> Aim to save 3-6 months of living expenses in your emergency fund.</li>
            </ul>

            <h3>3. Pay Down Debt</h3>
            <ul>
                <li><input type="checkbox" /> Make a list of all your debts, including the total amount, interest rate, and minimum monthly payment.</li>
                <li><input type="checkbox" /> Choose a debt repayment strategy (e.g., debt snowball or debt avalanche).</li>
                <li><input type="checkbox" /> Make extra payments on your highest-priority debt whenever possible.</li>
            </ul>

            <h3>4. Improve Your Credit</h3>
            <ul>
                <li><input type="checkbox" /> Check your credit report for errors.</li>
                <li><input type="checkbox" /> Pay your bills on time, every time.</li>
                <li><input type="checkbox" /> Keep your credit utilization low.</li>
            </ul>

            <h3>5. Plan for Retirement</h3>
            <ul>
                <li><input type="checkbox" /> If your employer offers a retirement plan (e.g., 401(k)), contribute enough to get the full employer match.</li>
                <li><input type="checkbox" /> Consider opening an Individual Retirement Account (IRA).</li>
                <li><input type="checkbox" /> Increase your retirement contributions over time.</li>
            </ul>

            <hr/>

            <h2>Budget Calculator</h2>
            <div className="calculator">
                <div className="form-group">
                    <label htmlFor="income">Monthly Income:</label>
                    <input type="number" id="income" placeholder="Enter your monthly income" value={income} onChange={(e) => setIncome(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="expenses">Monthly Expenses:</label>
                    <input type="number" id="expenses" placeholder="Enter your total monthly expenses" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
                </div>
                <button onClick={calculateBudget}>Calculate</button>
                <div id="result" dangerouslySetInnerHTML={{ __html: result }}></div>
            </div>
        </>
    );
};

export default FinancialHealth;
