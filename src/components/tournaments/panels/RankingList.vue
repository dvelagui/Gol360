<template>
  <div class="ranking-list">
    <div v-if="title" class="list-header">
      <q-icon v-if="icon" :name="icon" :color="iconColor" size="24px" class="q-mr-sm" />
      <span class="text-subtitle1 text-weight-bold">{{ title }}</span>
    </div>

    <div v-if="items.length > 0" class="list-items">
      <slot
        v-for="(item, index) in items"
        :key="index"
        name="item"
        :item="item"
        :index="index"
      />
    </div>

    <div v-else class="empty-state">
      <q-icon name="leaderboard" size="64px" color="grey-4" />
      <div class="text-body1 text-grey-6 q-mt-md">{{ emptyMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  items: unknown[]
  title?: string
  icon?: string
  iconColor?: string
  emptyMessage?: string
}>()
</script>

<style scoped lang="scss">
.ranking-list {
  width: 100%;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 12px 0;
  margin-bottom: 16px;
  border-bottom: 2px solid #E0E0E0;
}

.list-items {
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}
</style>
