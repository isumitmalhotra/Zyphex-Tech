import { NextRequest, NextResponse } from 'next/server'

/**
 * @swagger
 * /api/careers/subscribe:
 *   post:
 *     summary: Subscribe to job alerts
 *     description: Subscribe to receive email notifications about new job openings
 *     tags:
 *       - Careers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address for job alerts
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Areas of interest (Engineering, Design, Product, etc.)
 *     responses:
 *       200:
 *         description: Successfully subscribed to job alerts
 *       400:
 *         description: Invalid email format
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, interests } = body

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // TODO: Save to database or email service
    // const subscription = await prisma.jobAlertSubscription.create({
    //   data: {
    //     email,
    //     interests: interests || [],
    //     subscribedAt: new Date()
    //   }
    // })

    // TODO: Add to email marketing list (Mailchimp, SendGrid, etc.)
    // await addToMailingList(email, { interests })

    console.log('Job alert subscription:', { email, interests })

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to job alerts'
    })
  } catch (error) {
    console.error('Error subscribing to job alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
