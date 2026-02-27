import type { IInteractiveFormElement } from 'client-types/';

import { InteractiveFormElement } from '@/components/Elements/InteractiveForm';

interface Props {
  items: IInteractiveFormElement[];
}

const InlinedInteractiveFormList = ({ items }: Props) => (
  <div className="flex flex-col gap-4">
    {items.map((formElement) => (
      <InteractiveFormElement key={formElement.id} element={formElement} />
    ))}
  </div>
);

export { InlinedInteractiveFormList };
