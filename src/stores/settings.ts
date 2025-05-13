import { defineStore } from 'pinia';

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxRate: number;
  receiptTagline: string;
  logo?: string;
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  business: BusinessSettings;
  receiptSettings: {
    showLogo: boolean;
    showBarcode: boolean;
    enableEmailReceipts: boolean;
    enableSmsReceipts: boolean;
    defaultMessage: string;
    printAutomatically: boolean;
  };
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    theme: 'system',
    language: 'en',
    business: {
      name: "Renee's Artisinal",
      address: "123 Coffee Lane, Brewville",
      phone: "(555) 123-4567",
      email: "hello@reneesartisinal.com",
      website: "www.reneesartisinal.com",
      taxRate: 0.07, // 7% tax rate
      receiptTagline: "Thank you for your business!",
      logo: undefined
    },
    receiptSettings: {
      showLogo: true,
      showBarcode: true,
      enableEmailReceipts: true,
      enableSmsReceipts: true,
      defaultMessage: "Thanks for visiting! See you again soon!",
      printAutomatically: false
    }
  }),
  
  actions: {
    updateTheme(theme: 'light' | 'dark' | 'system') {
      this.theme = theme;
      localStorage.setItem('theme', theme);
    },
    
    updateLanguage(language: string) {
      this.language = language;
      localStorage.setItem('language', language);
    },
    
    updateBusinessSettings(settings: Partial<BusinessSettings>) {
      this.business = { ...this.business, ...settings };
      localStorage.setItem('businessSettings', JSON.stringify(this.business));
    },
    
    updateReceiptSettings(settings: Partial<SettingsState['receiptSettings']>) {
      this.receiptSettings = { ...this.receiptSettings, ...settings };
      localStorage.setItem('receiptSettings', JSON.stringify(this.receiptSettings));
    },
    
    loadSettings() {
      // Load settings from localStorage
      const theme = localStorage.getItem('theme');
      if (theme) {
        this.theme = theme as 'light' | 'dark' | 'system';
      }
      
      const language = localStorage.getItem('language');
      if (language) {
        this.language = language;
      }
      
      const businessSettings = localStorage.getItem('businessSettings');
      if (businessSettings) {
        this.business = JSON.parse(businessSettings);
      }
      
      const receiptSettings = localStorage.getItem('receiptSettings');
      if (receiptSettings) {
        this.receiptSettings = JSON.parse(receiptSettings);
      }
    }
  }
}); 