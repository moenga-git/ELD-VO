import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import axios from 'axios'

export default function PDFExport({ tripId, logs }) {
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadUrl, setUploadUrl] = useState(null)
  const [publicUrl, setPublicUrl] = useState(null)

  const generatePDF = async () => {
    setGenerating(true)
    
    try {
      const pdf = new jsPDF()
      let yPosition = 20

      // Add title
      pdf.setFontSize(20)
      pdf.text('ELD Daily Logs', 20, yPosition)
      yPosition += 20

      // Add trip info
      pdf.setFontSize(12)
      pdf.text(`Trip ID: ${tripId}`, 20, yPosition)
      yPosition += 10
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition)
      yPosition += 20

      // Add each day's log
      logs.logs.forEach((day, dayIndex) => {
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = 20
        }

        // Day header
        pdf.setFontSize(16)
        pdf.text(`Day ${dayIndex + 1}: ${new Date(day.date).toLocaleDateString()}`, 20, yPosition)
        yPosition += 15

        // Daily totals
        pdf.setFontSize(12)
        if (day.totals) {
          pdf.text(`Driving: ${day.totals.driving_hours?.toFixed(1) || '0.0'}h`, 20, yPosition)
          pdf.text(`On Duty: ${day.totals.on_duty_hours?.toFixed(1) || '0.0'}h`, 80, yPosition)
          pdf.text(`Off Duty: ${day.totals.off_duty_hours?.toFixed(1) || '0.0'}h`, 140, yPosition)
          yPosition += 10
        }

        // Duty entries
        if (day.duty_entries) {
          pdf.setFontSize(10)
          day.duty_entries.forEach(entry => {
            if (yPosition > 270) {
              pdf.addPage()
              yPosition = 20
            }

            const startTime = new Date(entry.start).toLocaleTimeString()
            const endTime = new Date(entry.end).toLocaleTimeString()
            const status = entry.duty_status.replace('_', ' ')
            
            pdf.text(`${startTime} - ${endTime}: ${status}`, 20, yPosition)
            if (entry.note) {
              pdf.text(`  Note: ${entry.note}`, 20, yPosition + 5)
              yPosition += 5
            }
            if (entry.rule_applied) {
              pdf.text(`  Rule: ${entry.rule_applied}`, 20, yPosition + 5)
              yPosition += 5
            }
            yPosition += 10
          })
        }

        yPosition += 10
      })

      // Save PDF
      const pdfBlob = pdf.output('blob')
      
      // Get upload URL
      setUploading(true)
      const uploadResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/trips/${tripId}/upload-url/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
          }
        }
      )

      const { upload_url, public_url } = uploadResponse.data
      setUploadUrl(upload_url)
      setPublicUrl(public_url)

      // Upload PDF
      await axios.put(upload_url, pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf'
        }
      })

    } catch (error) {
      console.error('PDF generation/upload failed:', error)
      alert('Failed to generate or upload PDF: ' + error.message)
    } finally {
      setGenerating(false)
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={generatePDF}
          disabled={generating || uploading}
          className="glass-button"
        >
          {generating ? 'Generating PDF...' : uploading ? 'Uploading...' : 'Generate PDF'}
        </button>
      </div>

      {publicUrl && (
        <div className="bg-white/10 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">PDF Generated Successfully!</h3>
          <p className="text-white/80 mb-3">
            Your ELD logs have been saved and are available at:
          </p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-eld-green hover:text-eld-dark-green underline break-all"
          >
            {publicUrl}
          </a>
        </div>
      )}

      {uploadUrl && !publicUrl && (
        <div className="bg-white/10 rounded-lg p-4">
          <p className="text-white/80">
            PDF is being uploaded... This may take a moment.
          </p>
        </div>
      )}
    </div>
  )
}
