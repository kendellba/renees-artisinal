<template>
  <v-card>
    <v-data-table
      :items="items"
      :items-per-page="itemsPerPage"
      :headers="headers"
      :search="search"
      :loading="loading"
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      class="elevation-1"
      @update:options="onOptionsUpdate"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>{{ title }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <slot name="toolbar-actions"></slot>
          <SearchBar
            v-if="showSearch"
            v-model="searchValue"
            :label="searchLabel"
            :placeholder="searchPlaceholder"
            @search="onSearch"
          />
        </v-toolbar>
      </template>

      <template v-for="(_, slot) in $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope"></slot>
      </template>

      <template v-slot:no-data>
        <slot name="no-data">
          No data available.
        </slot>
      </template>

      <template v-slot:loading>
        <slot name="loading">
          <v-progress-linear
            indeterminate
            color="primary"
          ></v-progress-linear>
        </slot>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import SearchBar from './SearchBar.vue';

interface Header {
  title: string;
  key: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

interface Props {
  items: any[];
  headers: Header[];
  title?: string;
  itemsPerPage?: number;
  loading?: boolean;
  showSearch?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  sortBy?: string[];
  sortDesc?: boolean[];
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  itemsPerPage: 10,
  loading: false,
  showSearch: true,
  searchLabel: 'Search',
  searchPlaceholder: 'Type to search...',
  sortBy: () => [],
  sortDesc: () => []
});

const emit = defineEmits(['update:options', 'search']);

const searchValue = ref('');
const search = ref('');

watch(searchValue, (newValue) => {
  search.value = newValue;
});

const onSearch = (value: string) => {
  emit('search', value);
};

const onOptionsUpdate = (options: any) => {
  emit('update:options', options);
};
</script> 