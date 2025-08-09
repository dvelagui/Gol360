<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="row no-wrap full-height">
        <div class="col-12 col-md-7 q-pa-none">
          <q-img src="@/assets/img_login.png" class="full-height" style="object-fit: cover;" />
        </div>
        <div class="col-12 col-md-5 flex flex-column flex-center">
          <router-view />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
</script>
