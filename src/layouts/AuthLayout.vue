<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="row no-wrap full-height">
        <div class="col-12 col-md-7 q-pa-none img-login">
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
<style scoped lang="scss">

@media (max-width: 725px) {


  .img-login {
    display: none;
  }
}
</style>
