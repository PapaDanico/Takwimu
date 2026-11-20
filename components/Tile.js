export default function Tile({ label, value, unit, note, tone, dashed, tag }) {
  return (
    <div className={`tile${tone ? ` ${tone}` : ''}${dashed ? ' dashed' : ''}`}>
      <p className="k">{label} {tag && <span className="tag warn">{tag}</span>}</p>
      <p className="v">{value}{unit && <small>{unit}</small>}</p>
      {note && <p className="m">{note}</p>}
    </div>
  );
}
