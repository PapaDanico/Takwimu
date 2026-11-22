'use client';
// Opens every table view first, so the printout carries the exact values, then prints.
export default function PrintButton({ label = 'Print this view' }) {
  const onPrint = () => {
    document.querySelectorAll('details.tableview').forEach((d) => { d.open = true; });
    window.print();
  };
  return <button type="button" className="btn-s ghost" onClick={onPrint}>{label}</button>;
}
