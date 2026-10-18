import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UrlRedirectDocument = HydratedDocument<UrlRedirect>;

@Schema({ collection: 'url_redirects', timestamps: true })
export class UrlRedirect {
  @Prop({ required: true, unique: true, index: true })
  sourcePath: string;

  @Prop({ required: true })
  targetPath: string;

  @Prop({ type: Number, default: 301 })
  statusCode: number;
}
export const UrlRedirectSchema = SchemaFactory.createForClass(UrlRedirect);
