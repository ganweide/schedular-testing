import React, { useEffect, useState } from 'react';

const App = () => {
  const [reminders, setReminders] = useState([]);

  // Function to fetch reminders from the backend
  const fetchReminders = async () => {
    try {
      const response = await fetch('http://localhost:3004/reminders');
      const data = await response.json();
      setReminders(data);
      console.log(response);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  useEffect(() => {
    // Fetch reminders on component mount and every 30 seconds
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000); // Poll every 30 seconds

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, action) => {
    try {
      await fetch(`http://localhost:3004/reminder-action/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      // Fetch reminders again after user action
      fetchReminders();
    } catch (error) {
      console.error(`Error sending ${action} action:`, error);
    }
  };

  return (
    <div className="App">
      <h1>Booking Scheduler</h1>
      <h2>Upcoming Booking Reminders:</h2>
      <ul>
        {reminders.length > 0 ? (
          reminders.map((reminder, index) => (
            <li key={index}>
              {reminder.message}
              <div>
                <button onClick={() => handleAction(reminder.id, 'yes')}>Yes</button>
                <button onClick={() => handleAction(reminder.id, 'no')}>No</button>
              </div>
            </li>
          ))
        ) : (
          <li>No upcoming reminders</li>
        )}
      </ul>
    </div>
  );
};

export default App;
