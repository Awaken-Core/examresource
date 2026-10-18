import { Buffer } from 'node:buffer';
import { env } from 'cloudflare:workers';

type ResizeOptions = {
  width?: number;
  height?: number;
  fit?: 'inside' | 'contain' | 'cover' | 'fill' | 'outside';
  withoutEnlargement?: boolean;
};

type WebpOptions = {
  quality?: number;
};

type SharpMetadata = {
  format?: string;
  width?: number;
  height?: number;
  pages?: number;
  pageHeight?: number;
};

const formatName = (contentType: string) => {
  const format = contentType.replace(/^image\//, '').toLowerCase();
  return format === 'svg+xml' ? 'svg' : format;
};

const fitName = (fit: ResizeOptions['fit']): ImageTransform['fit'] => {
  switch (fit) {
    case 'cover':
      return 'cover';
    case 'fill':
      return 'squeeze';
    case 'contain':
      return 'contain';
    case 'outside':
      return 'cover';
    case 'inside':
    default:
      return 'scale-down';
  }
};

class WorkerSharpPipeline {
  private resizeOptions?: ResizeOptions;
  private webpOptions?: WebpOptions;

  constructor(private readonly input: Uint8Array) {}

  async metadata(): Promise<SharpMetadata> {
    const info = await env.IMAGES.info(this.stream());
    if (!('width' in info)) {
      return { format: formatName(info.format) };
    }
    return {
      format: formatName(info.format),
      width: info.width,
      height: info.height,
    };
  }

  resize(options: ResizeOptions) {
    this.resizeOptions = options;
    return this;
  }

  webp(options: WebpOptions = {}) {
    this.webpOptions = options;
    return this;
  }

  async toBuffer(): Promise<Buffer> {
    let transformer = env.IMAGES.input(this.stream());
    if (this.resizeOptions) {
      transformer = transformer.transform({
        width: this.resizeOptions.width,
        height: this.resizeOptions.height,
        fit: fitName(this.resizeOptions.fit),
      });
    }

    const result = await transformer.output({
      format: 'image/webp',
      quality: this.webpOptions?.quality,
      anim: true,
    });
    return Buffer.from(await new Response(result.image()).arrayBuffer());
  }

  private stream(): ReadableStream<Uint8Array> {
    const bytes = this.input.slice();
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });
  }
}

export default function sharp(input: Uint8Array): WorkerSharpPipeline {
  return new WorkerSharpPipeline(input);
}
