interface EventLogPanelProps {
  log: string[];
}

export function EventLogPanel({ log }: EventLogPanelProps) {
  return (
    <div className="garden-column log-column">
      <h3>Event Log</h3>
      <ul className="event-log">
        {log.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
