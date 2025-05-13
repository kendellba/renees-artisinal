import { defineStore } from 'pinia';

export interface Customer {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  // Loyalty system additions
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'none';
  birthDate?: string;
  joinDate: string;
  lastVisitDate?: string;
  totalSpent: number;
  notes?: string;
}

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum' | 'none';
  pointsNeeded: number;
  discountPercentage: number;
  birthdayBonus: number;
  pointsMultiplier: number;
}

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  loyaltyTiers: LoyaltyTier[];
  pointsPerDollar: number;
}

// Utility functions for loyalty system
const calculateLoyaltyTier = (points: number, tiers: LoyaltyTier[]): LoyaltyTier['name'] => {
  const sortedTiers = [...tiers].sort((a, b) => b.pointsNeeded - a.pointsNeeded);
  for (const tier of sortedTiers) {
    if (points >= tier.pointsNeeded) {
      return tier.name;
    }
  }
  return 'none';
};

export const useCustomerStore = defineStore('customer', {
  state: (): CustomerState => ({
    customers: [],
    loading: false,
    error: null,
    loyaltyTiers: [
      { name: 'none', pointsNeeded: 0, discountPercentage: 0, birthdayBonus: 0, pointsMultiplier: 1 },
      { name: 'bronze', pointsNeeded: 100, discountPercentage: 5, birthdayBonus: 50, pointsMultiplier: 1 },
      { name: 'silver', pointsNeeded: 500, discountPercentage: 10, birthdayBonus: 100, pointsMultiplier: 1.5 },
      { name: 'gold', pointsNeeded: 1000, discountPercentage: 15, birthdayBonus: 200, pointsMultiplier: 2 },
      { name: 'platinum', pointsNeeded: 2000, discountPercentage: 20, birthdayBonus: 500, pointsMultiplier: 3 }
    ],
    pointsPerDollar: 1 // Base points earned per dollar spent
  }),

  getters: {
    getCustomerById: (state) => (id: string | number) => {
      return state.customers.find(customer => customer.id === id);
    },
    
    getCustomerByEmail: (state) => (email: string) => {
      return state.customers.find(customer => customer.email.toLowerCase() === email.toLowerCase());
    },

    searchCustomers: (state) => (query: string) => {
      const searchTerm = query.toLowerCase();
      return state.customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    },

    getTotalCustomers: (state) => {
      return state.customers.length;
    },

    getTierByName: (state) => (tierName: LoyaltyTier['name']) => {
      return state.loyaltyTiers.find(tier => tier.name === tierName) || state.loyaltyTiers[0];
    },

    getCustomersWithBirthdayThisMonth: (state) => {
      const currentMonth = new Date().getMonth() + 1;
      return state.customers.filter(customer => {
        if (!customer.birthDate) return false;
        const birthMonth = new Date(customer.birthDate).getMonth() + 1;
        return birthMonth === currentMonth;
      });
    },

    getTopCustomers: (state) => (count: number = 10) => {
      return [...state.customers]
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, count);
    }
  },

  actions: {
    loadCustomers() {
      const storedCustomers = localStorage.getItem('customers');
      if (storedCustomers) {
        this.customers = JSON.parse(storedCustomers);
      }
    },
    
    async fetchCustomers() {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call when available
        // For now, if no customers, add a couple sample ones
        if (this.customers.length === 0) {
          this.customers = [
            {
              id: 1,
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '(555) 123-4567',
              address: '123 Main St, Anytown, USA',
              loyaltyPoints: 350,
              loyaltyTier: 'bronze',
              birthDate: '1985-06-15',
              joinDate: '2023-01-10',
              lastVisitDate: '2024-04-01',
              totalSpent: 450.75,
              notes: 'Prefers non-dairy milk options'
            },
            {
              id: 2,
              name: 'Jane Smith',
              email: 'jane.smith@example.com',
              phone: '(555) 987-6543',
              loyaltyPoints: 1250,
              loyaltyTier: 'gold',
              birthDate: '1990-05-20',
              joinDate: '2023-02-15',
              lastVisitDate: '2024-04-30',
              totalSpent: 1875.25,
              notes: 'Regular - visits every Tuesday morning'
            }
          ];
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch customers';
      } finally {
        this.loading = false;
      }
    },

    async addCustomer(customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'loyaltyTier' | 'joinDate' | 'totalSpent'>) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const newCustomer: Customer = {
          ...customer,
          id: Math.max(0, ...this.customers.map(c => typeof c.id === 'string' ? parseInt(c.id) : c.id)) + 1,
          loyaltyPoints: 0,
          loyaltyTier: 'none',
          joinDate: new Date().toISOString().split('T')[0],
          totalSpent: 0
        };
        
        this.customers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(this.customers));
        return newCustomer;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add customer';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateCustomer(id: string | number, updates: Partial<Customer>) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const index = this.customers.findIndex(c => c.id === id);
        if (index === -1) {
          throw new Error('Customer not found');
        }
        this.customers[index] = { ...this.customers[index], ...updates };

        // If points were updated, recalculate tier
        if (updates.loyaltyPoints !== undefined) {
          this.customers[index].loyaltyTier = calculateLoyaltyTier(
            this.customers[index].loyaltyPoints, 
            this.loyaltyTiers
          );
        }

        localStorage.setItem('customers', JSON.stringify(this.customers));
        return this.customers[index];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update customer';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteCustomer(id: string | number) {
      this.loading = true;
      this.error = null;
      try {
        // TODO: Replace with actual API call
        const index = this.customers.findIndex(c => c.id === id);
        if (index === -1) {
          throw new Error('Customer not found');
        }
        this.customers.splice(index, 1);
        localStorage.setItem('customers', JSON.stringify(this.customers));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete customer';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Loyalty system methods
    async addLoyaltyPoints(customerId: string | number, purchaseAmount: number) {
      const customer = this.getCustomerById(customerId);
      if (!customer) throw new Error('Customer not found');
      
      const tier = this.getTierByName(customer.loyaltyTier);
      const pointsEarned = Math.floor(purchaseAmount * this.pointsPerDollar * tier.pointsMultiplier);
      
      await this.updateCustomer(customerId, {
        loyaltyPoints: customer.loyaltyPoints + pointsEarned,
        lastVisitDate: new Date().toISOString().split('T')[0],
        totalSpent: customer.totalSpent + purchaseAmount
      });
      
      return pointsEarned;
    },

    async redeemPoints(customerId: string | number, pointsToRedeem: number) {
      const customer = this.getCustomerById(customerId);
      if (!customer) throw new Error('Customer not found');
      if (customer.loyaltyPoints < pointsToRedeem) throw new Error('Insufficient points');
      
      await this.updateCustomer(customerId, {
        loyaltyPoints: customer.loyaltyPoints - pointsToRedeem
      });
      
      return true;
    },

    isBirthdayMonth(customer: Customer) {
      if (!customer.birthDate) return false;
      
      const today = new Date();
      const birthDate = new Date(customer.birthDate);
      return today.getMonth() === birthDate.getMonth();
    },

    getBirthdayDiscount(customerId: string | number) {
      const customer = this.getCustomerById(customerId);
      if (!customer) return 0;
      
      if (this.isBirthdayMonth(customer)) {
        const tier = this.getTierByName(customer.loyaltyTier);
        return tier.birthdayBonus;
      }
      
      return 0;
    },

    getLoyaltyDiscount(customerId: string | number) {
      const customer = this.getCustomerById(customerId);
      if (!customer) return 0;
      
      const tier = this.getTierByName(customer.loyaltyTier);
      return tier.discountPercentage;
    }
  }
}); 