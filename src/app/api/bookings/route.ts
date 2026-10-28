import { NextResponse } from 'next/server';
import { sendBookingConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nganila-f3948';
    const cloudFunctionUrl = process.env.NEXT_PUBLIC_FIREBASE_CREATE_BOOKING_URL || `https://us-central1-${projectId}.cloudfunctions.net/createBooking`;
    const response = await fetch(cloudFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to submit booking' },
        { status: response.status }
      );
    }

    // Trigger non-blocking customer confirmation email upon successful booking creation
    const bookingId = data.id || data.bookingId;
    if (bookingId && body.email) {
      sendBookingConfirmationEmail({
        bookingId,
        customerEmail: body.email,
        customerName: body.customerName || 'Valued Customer',
        serviceType: body.serviceType || 'Liquid Waste Management',
        appointmentDate: body.appointmentDateFormatted || body.appointmentDate,
        preferredTime: body.preferredTime,
        phone: body.phone,
      }).catch((emailErr) => {
        console.warn('[api/bookings] Failed sending customer confirmation email:', emailErr.message);
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in /api/bookings route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
