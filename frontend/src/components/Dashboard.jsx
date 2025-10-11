import React from 'react';

function Dashboard() {
    // Mock data for now, to be replaced with data from the backend
    const stats = {
        totalCreditors: 12,
        fdcpaViolations: 5,
        activeDisputes: 3,
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <div className="dashboard-stats">
                <div>
                    <h3>Total Creditors</h3>
                    <p>{stats.totalCreditors}</p>
                </div>
                <div>
                    <h3>FDCPA Violations</h3>
                    <p>{stats.fdcpaViolations}</p>
                </div>
                <div>
                    <h3>Active Disputes</h3>
                    <p>{stats.activeDisputes}</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;