import { defineStore } from 'pinia';
import { useProductsStore, type Product } from './products';
import { useCustomerStore, type Customer } from './customers';
import { useSettingsStore } from './settings';
import storage from '../utilities/storage';

export interface InvoiceItem {
  productId?: string; // Link to an existing product if applicable
  description: string; // Product name or custom service description
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string; // Auto-generate, e.g., INV-YYYYMMDD-001
  customerId: string;
  issueDate: string; // ISO string format
  dueDate: string; // ISO string format
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number; // Fixed amount
  discountPercentage: number; // Percentage (0-100)
  taxRate: number; // Tax rate applied to this invoice (percentage)
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  paymentTerms?: string;
}

interface InvoicesState {
  invoices: Invoice[];
  lastInvoiceNumberSuffix: number; // For generating invoice numbers
  loading: boolean;
  error: string | null;
}

// Helper to generate next invoice number
const generateInvoiceNumber = (suffix: number): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `INV-${year}${month}${day}-${suffix.toString().padStart(3, '0')}`;
};

export const useInvoicesStore = defineStore('invoices', {
  state: (): InvoicesState => ({
    invoices: [],
    lastInvoiceNumberSuffix: 0,
    loading: false,
    error: null,
  }),
  actions: {
    async addInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'subtotal' | 'taxAmount' | 'totalAmount'>): Promise<Invoice> {
      this.loading = true;
      this.error = null;
      try {
        const settingsStore = useSettingsStore();
        this.lastInvoiceNumberSuffix++;
        const newInvoiceNumber = generateInvoiceNumber(this.lastInvoiceNumberSuffix);

        let subtotal = 0;
        invoiceData.items.forEach(item => {
          item.total = item.quantity * item.unitPrice;
          subtotal += item.total;
        });

        let totalAfterDiscount = subtotal;
        if (invoiceData.discountAmount > 0) {
          totalAfterDiscount -= invoiceData.discountAmount;
        } else if (invoiceData.discountPercentage > 0) {
          totalAfterDiscount -= (totalAfterDiscount * invoiceData.discountPercentage / 100);
        }

        const taxApplicable = (settingsStore.businessSettings?.taxSettings?.isTaxApplicable ?? true);
        const taxAmount = taxApplicable && invoiceData.taxRate > 0
          ? (totalAfterDiscount * invoiceData.taxRate / 100)
          : 0;

        const totalAmount = totalAfterDiscount + taxAmount;

        const newInvoice: Invoice = {
          ...invoiceData,
          id: crypto.randomUUID(),
          invoiceNumber: newInvoiceNumber,
          subtotal,
          taxAmount,
          totalAmount,
        };

        // TODO: Add API call here when backend is ready
        this.invoices.push(newInvoice);        await storage.set('invoices', this.invoices);
        await storage.set('lastInvoiceNumberSuffix', this.lastInvoiceNumberSuffix);
        
        return newInvoice;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add invoice';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateInvoice(invoiceId: string, updates: Partial<Invoice>) {
      this.loading = true;
      this.error = null;
      try {
        const index = this.invoices.findIndex(inv => inv.id === invoiceId);
        if (index === -1) {
          throw new Error('Invoice not found');
        }

        // Create updated invoice with recalculated totals if needed
        const updatedInvoice = { ...this.invoices[index], ...updates };
        
        // TODO: Add API call here when backend is ready
        this.invoices[index] = updatedInvoice;
        localStorage.setItem('invoices', JSON.stringify(this.invoices));
        
        return updatedInvoice;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update invoice';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteInvoice(invoiceId: string) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Add API call here when backend is ready        this.invoices = this.invoices.filter(inv => inv.id !== invoiceId);
        await storage.set('invoices', this.invoices);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete invoice';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
      const index = this.invoices.findIndex(inv => inv.id === invoiceId);
      if (index !== -1) {
        this.invoices[index].status = status;
        this.updateInvoice(invoiceId, { status });
      }
    },    async loadInvoices() {
      const storedInvoices = await storage.get('invoices');
      if (storedInvoices) {
        this.invoices = storedInvoices;
      }
      const storedSuffix = await storage.get('lastInvoiceNumberSuffix');
      if (storedSuffix) {
        this.lastInvoiceNumberSuffix = parseInt(storedSuffix, 10);
      }
    },

    async fetchInvoices() {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        await this.loadInvoices(); // For now, just load from localStorage
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch invoices';
      } finally {
        this.loading = false;
      }
    }
  },
  getters: {
    getInvoiceById: (state) => (id: string) => {
      return state.invoices.find(inv => inv.id === id);
    },
    getInvoicesByStatus: (state) => (status: InvoiceStatus) => {
      return state.invoices.filter(inv => inv.status === status);
    },
    getInvoicesByDateRange: (state) => (startDate: string, endDate: string) => {
      return state.invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issueDate);
        return invoiceDate >= new Date(startDate) && invoiceDate <= new Date(endDate);
      });
    },
    getTotalInvoices: (state) => {
      return state.invoices.reduce((total, invoice) => total + invoice.totalAmount, 0);
    },
    getInvoicesCount: (state) => {
      return state.invoices.length;
    },
    getUnpaidInvoices: (state) => {
      return state.invoices.filter(invoice => invoice.status === 'Sent');
    },
    getOverdueInvoices: (state) => {
      const today = new Date();
      return state.invoices.filter(invoice => 
        invoice.status === 'Sent' && new Date(invoice.dueDate) < today
      );
    }
  }
});