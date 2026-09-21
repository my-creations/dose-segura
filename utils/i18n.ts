import { I18n } from 'i18n-js';

import { Strings } from '@/constants/Strings';

const i18n = new I18n(Strings);

/**
 * Portuguese only (pt-PT). The app serves the Portuguese market, so the device locale is
 * deliberately ignored and there is no runtime language switching: `Strings` ships a single
 * catalogue. Every user-facing string must exist under `pt`.
 */
i18n.locale = 'pt';
i18n.defaultLocale = 'pt';

export default i18n;
