// Background Runner script for alarm checks
// This runs outside the web view when the app is backgrounded/killed

addEventListener('checkAlarms', async (resolve, reject, args) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday...

    // Check stored alarms from persistent storage
    const alarmsJson = CapacitorKV.get('active_alarms');
    
    if (!alarmsJson) {
      resolve();
      return;
    }

    let alarms;
    try {
      alarms = JSON.parse(alarmsJson);
    } catch (e) {
      resolve();
      return;
    }

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;

      const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
      
      // Check if current time matches alarm time
      if (alarmHour === currentHour && alarmMinute === currentMinute) {
        // Check if today is a scheduled day
        const days = alarm.days_of_week || [1, 2, 3, 4, 5]; // Default Mon-Fri in app format
        if (days.includes(currentDay)) {
          // Schedule an immediate notification to wake the user
          const scheduleDate = new Date();
          scheduleDate.setSeconds(scheduleDate.getSeconds() + 1);

          CapacitorNotifications.schedule([
            {
              id: Math.floor(Math.random() * 90000) + 10000,
              title: '⏰ Wake Up!',
              body: alarm.label || 'Time to wake up!',
              scheduleAt: scheduleDate,
            },
          ]);
        }
      }
    }

    resolve();
  } catch (err) {
    console.error('Background alarm check failed:', err);
    reject(err);
  }
});
