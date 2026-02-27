export type IElement =
  | IImageElement
  | ITextElement
  | IPdfElement
  | ITasklistElement
  | IAudioElement
  | IVideoElement
  | IFileElement
  | IPlotlyElement
  | IDataframeElement
  | ICustomElement
  | IInteractiveFormElement;

export type IMessageElement =
  | IImageElement
  | ITextElement
  | IPdfElement
  | IAudioElement
  | IVideoElement
  | IFileElement
  | IPlotlyElement
  | IDataframeElement
  | ICustomElement
  | IInteractiveFormElement;

export type ElementType = IElement['type'];
export type IElementSize = 'small' | 'medium' | 'large';

interface TElement<T> {
  id: string;
  type: T;
  threadId?: string;
  forId: string;
  mime?: string;
  url?: string;
  chainlitKey?: string;
  /** Inline content when loading from thread (e.g. plotly JSON from blob). */
  content?: string;
}

interface TMessageElement<T> extends TElement<T> {
  name: string;
  display: 'inline' | 'side' | 'page';
}

export interface IImageElement extends TMessageElement<'image'> {
  size?: IElementSize;
}

export interface ITextElement extends TMessageElement<'text'> {
  language?: string;
}

export interface IPdfElement extends TMessageElement<'pdf'> {
  page?: number;
}

export interface IAudioElement extends TMessageElement<'audio'> {
  autoPlay?: boolean;
}

export interface IVideoElement extends TMessageElement<'video'> {
  size?: IElementSize;

  /**
   * Override settings for each type of player in ReactPlayer
   * https://github.com/cookpete/react-player?tab=readme-ov-file#config-prop
   * @type {object}
   */
  playerConfig?: object;
}

export interface IFileElement extends TMessageElement<'file'> {
  type: 'file';
}

export type IPlotlyElement = TMessageElement<'plotly'>;

export type ITasklistElement = TElement<'tasklist'>;

export type IDataframeElement = TMessageElement<'dataframe'>;

export interface ICustomElement extends TMessageElement<'custom'> {
  props: Record<string, unknown>;
}

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio';

export interface IFormField {
  id: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  value?: string | number | boolean;
  required?: boolean;
}

export interface IInteractiveFormProps {
  title?: string;
  promptMessage?: string;
  fields: IFormField[];
  showExtraMessage?: boolean;
}

export interface IInteractiveFormElement extends TMessageElement<'interactive_form'> {
  props: IInteractiveFormProps;
}
