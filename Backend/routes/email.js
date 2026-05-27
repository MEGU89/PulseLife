import express from "express";

import Request from "../models/Request.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";

const router = express.Router();

router.post("/send-donation-scheduled", async (req, res) => {
  try {
    const {
      requestId,
      donorId,
      donorName,
      donorEmail,
      hospital,
      bloodType,
      units,
      recipientName,
      isRecipientRequest,
    } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    let recipientUser = null;
    if (isRecipientRequest && request.requestedBy) {
      recipientUser = await User.findById(request.requestedBy);
    }

    const emailsSent = [];

    const donorEmailBody = `
      <h2>Blood donation scheduled</h2>
      <p>Hi ${donorName},</p>
      <p>Your donation offer is now inside the hospital workflow.</p>
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Request details:</strong></p>
        <p>Blood Type: <strong>${bloodType}</strong></p>
        <p>Units Needed: <strong>${units}</strong></p>
        <p>Hospital: <strong>${hospital || "Not specified"}</strong></p>
      </div>
      <p>Please proceed with scheduling through the Pulselife donor dashboard.</p>
      <p>Best regards,<br>Pulselife Team</p>
    `;

    try {
      await sendEmail(donorEmail, "Blood Donation Scheduled - Pulselife", donorEmailBody);
      emailsSent.push(`Donor email sent to ${donorEmail}`);
    } catch (error) {
      console.error("Error sending donor email:", error);
    }

    if (isRecipientRequest && recipientUser?.email) {
      const recipientEmailBody = `
        <h2>Hospital update for your blood request</h2>
        <p>Hi ${recipientUser.fullName || "Recipient"},</p>
        <p>
          A donor has entered the hospital workflow for your request.
          The hospital will continue handling the donation process from their side.
        </p>
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Request details:</strong></p>
          <p>Blood Type: <strong>${bloodType}</strong></p>
          <p>Units: <strong>${units}</strong></p>
          <p>Hospital: <strong>${hospital || "Not specified"}</strong></p>
        </div>
        <p>There is no direct donor-recipient handoff in this flow. The hospital remains the coordinator.</p>
        <p>Best regards,<br>Pulselife Team</p>
      `;

      try {
        await sendEmail(
          recipientUser.email,
          "Hospital Update for Your Blood Request - Pulselife",
          recipientEmailBody,
        );
        emailsSent.push(`Recipient email sent to ${recipientUser.email}`);
      } catch (error) {
        console.error("Error sending recipient email:", error);
      }
    }

    if (hospital) {
      const hospitalUser = await User.findOne({
        fullName: hospital,
        role: "hospital",
      });

      if (hospitalUser?.email) {
        const hospitalEmailBody = `
          <h2>Donation schedule requires hospital review</h2>
          <p>Hi ${hospital},</p>
          <p>A donor has entered the hospital-managed workflow for a blood request.</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Donation details:</strong></p>
            <p>Donor: <strong>${donorName}</strong></p>
            <p>Donor Email: <strong>${donorEmail}</strong></p>
            <p>Blood Type: <strong>${bloodType}</strong></p>
            <p>Units Needed: <strong>${units}</strong></p>
            ${isRecipientRequest ? `<p>Recipient: <strong>${recipientName || "Not specified"}</strong></p>` : ""}
            <p>Request ID: <strong>${requestId}</strong></p>
          </div>
          <p>Please accept, reject, and complete this request from the hospital side.</p>
          <p>Best regards,<br>Pulselife Team</p>
        `;

        try {
          await sendEmail(
            hospitalUser.email,
            "Blood Donation Confirmed - Hospital Review Needed",
            hospitalEmailBody,
          );
          emailsSent.push(`Hospital email sent to ${hospitalUser.email}`);
        } catch (error) {
          console.error("Error sending hospital email:", error);
        }
      }
    }

    res.json({
      success: true,
      message: "Notification emails sent successfully",
      emailsSent,
    });
  } catch (error) {
    console.error("Error in send-donation-scheduled:", error);
    res.status(500).json({
      message: "Error sending emails",
      error: error.message,
    });
  }
});

export default router;
