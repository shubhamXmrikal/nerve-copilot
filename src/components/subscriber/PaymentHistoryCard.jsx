import { CreditCard, Info } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import './PaymentHistoryCard.css'

const MOCK_PAYMENTS = [
  { date: '21 Feb 2025', amount: 442, mode: 'Online/UPI',  status: 'Success', txnId: 'TXN8821934' },
  { date: '18 Jan 2025', amount: 350, mode: 'Online/Card', status: 'Success', txnId: 'TXN7743291' },
  { date: '05 Dec 2024', amount: 442, mode: 'Cash',        status: 'Success', txnId: 'TXN6612834' },
  { date: '02 Nov 2024', amount: 350, mode: 'Online/UPI',  status: 'Failed',  txnId: 'TXN5519023' },
  { date: '01 Oct 2024', amount: 442, mode: 'Online/UPI',  status: 'Success', txnId: 'TXN4408812' },
]

export default function PaymentHistoryCard() {
  const intentResult = useAppStore((s) => s.intentResult)

  if (intentResult?.intent !== 'recharge_issue') return null

  return (
    <div className="card payment-history-card animate-in" style={{ marginTop: 16 }}>
      <div className="card-header">
        <div className="card-title">
          <CreditCard size={14} />
          Payment History
        </div>
        <span className="badge badge-blue">{MOCK_PAYMENTS.length} records</span>
      </div>

      <div className="card-body" style={{ padding: '8px 0' }}>
        <table className="payment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Txn ID</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYMENTS.map((p) => (
              <tr key={p.txnId} className={p.status === 'Failed' ? 'payment-row-failed' : ''}>
                <td className="payment-date">{p.date}</td>
                <td className="payment-amount">₹{p.amount}</td>
                <td>
                  <span className="badge badge-gray payment-mode">{p.mode}</span>
                </td>
                <td>
                  <span className={`badge ${p.status === 'Success' ? 'badge-green' : 'badge-red'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="payment-txnid mono">{p.txnId}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="payment-note">
          <Info size={11} />
          Showing last 5 transactions from DB + payment gateway
        </div>
      </div>
    </div>
  )
}
