import { Subscription } from 'rxjs';

export const asEffectReset = (subscription: Subscription) => () => subscription.unsubscribe();
