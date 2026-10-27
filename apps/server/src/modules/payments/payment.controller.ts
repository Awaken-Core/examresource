import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service.js';
import { PaymentService } from './payment.service.js';

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

@Controller('api/v1')
export class PaymentController {
  constructor(
    private readonly payments: PaymentService,
    private readonly auth: AuthService,
  ) {}

  @Get('payments/test-series-pass/offer')
  offer() {
    return this.payments.offer();
  }

  @Get('payments/test-series-pass')
  async status(@Req() req: Request) {
    return this.payments.passStatus(await this.auth.requireUser(req));
  }

  @Get('payments/test-series-access')
  async access(@Query('seriesId') seriesId: string | undefined, @Req() req: Request) {
    if (!seriesId) throw new BadRequestException('seriesId is required.');
    return this.payments.seriesAccess(await this.auth.requireUser(req), seriesId);
  }

  @Post('payments/test-series-pass/orders')
  async createOrder(@Req() req: Request) {
    this.assertBrowserMutation(req);
    return this.payments.createOrder(await this.auth.requireUser(req));
  }

  @Post('payments/test-series-pass/verify')
  async verify(@Req() req: Request, @Body() body: unknown) {
    this.assertBrowserMutation(req);
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Payment verification fields are missing.');
    }
    return this.payments.verifyPayment(await this.auth.requireUser(req), parsed.data);
  }

  @Post('payments/razorpay/webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    return this.payments.handleWebhook(req.rawBody, signature);
  }

  private assertBrowserMutation(req: Request) {
    if (req.header('x-csrf-protection') !== '1') {
      throw new BadRequestException('Missing CSRF protection header.');
    }
  }
}
