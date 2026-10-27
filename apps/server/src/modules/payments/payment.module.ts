import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Exam,
  ExamSchema,
  PaymentOrder,
  PaymentOrderSchema,
  TestAttempt,
  TestAttemptSchema,
  TestSeriesPass,
  TestSeriesPassSchema,
} from '../../core/schema/index.js';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { TestSeriesAccessService } from './test-series-access.service.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: PaymentOrder.name, schema: PaymentOrderSchema },
      { name: TestSeriesPass.name, schema: TestSeriesPassSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: TestAttempt.name, schema: TestAttemptSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, TestSeriesAccessService],
  exports: [PaymentService, TestSeriesAccessService],
})
export class PaymentsModule {}
