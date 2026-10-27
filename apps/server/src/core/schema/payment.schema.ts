import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentOrderDocument = HydratedDocument<PaymentOrder>;
export type TestSeriesPassDocument = HydratedDocument<TestSeriesPass>;

@Schema({ collection: 'payment_orders', timestamps: true })
export class PaymentOrder {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, default: 'test_series_pass' })
  purpose: 'test_series_pass';

  @Prop({ type: Number, required: true })
  amountPaise: number;

  @Prop({ type: String, required: true, default: 'INR' })
  currency: string;

  @Prop({ type: String, required: true, unique: true })
  razorpayOrderId: string;

  @Prop({ type: String, default: null })
  razorpayPaymentId?: string | null;

  @Prop({ type: String, required: true })
  receipt: string;

  @Prop({
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created',
    index: true,
  })
  status: 'created' | 'paid' | 'failed';

  createdAt?: Date;
  updatedAt?: Date;
}

export const PaymentOrderSchema = SchemaFactory.createForClass(PaymentOrder);

@Schema({ collection: 'test_series_passes', timestamps: true })
export class TestSeriesPass {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['paid'], default: 'paid' })
  status: 'paid';

  @Prop({ type: Date, required: true })
  startsAt: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'PaymentOrder', required: true })
  paymentOrderId: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  razorpayPaymentId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TestSeriesPassSchema = SchemaFactory.createForClass(TestSeriesPass);
TestSeriesPassSchema.index({ userId: 1, expiresAt: -1 });
