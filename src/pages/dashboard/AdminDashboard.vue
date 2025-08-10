<template>
  <q-page padding>
    <!-- Encabezado -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Panel de Administración</div>
        <div class="text-caption text-grey-7">Control total de torneos, equipos, usuarios y videos</div>
      </div>
      <q-btn color="primary" icon="add" label="Nuevo torneo" @click="openCreateTournament" no-caps />
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-md q-mb-lg">
      <q-card v-for="k in kpis" :key="k.label" class="col-12 col-sm-6 col-md-3">
        <q-card-section class="row items-center q-gutter-md">
          <q-icon :name="k.icon" size="28px" />
          <div>
            <div class="text-subtitle1 text-weight-bold">{{ k.value }}</div>
            <div class="text-caption text-grey-7">{{ k.label }}</div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Acciones rápidas -->
    <div class="row q-col-gutter-md q-mb-lg">
      <q-card class="col-12 col-md-6">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">Torneos</div>
          <q-btn flat icon="open_in_new" @click="$router.push('/tournaments')" />
        </q-card-section>
        <q-separator />
        <q-list dense>
          <q-item v-for="t in tournaments.slice(0,5)" :key="t.id" clickable @click="$router.push(`/tournaments/${t.id}`)">
            <q-item-section avatar><q-icon name="emoji_events" /></q-item-section>
            <q-item-section>
              <q-item-label>{{ t.name }}</q-item-label>
              <q-item-label caption>Equipos: {{ t.teams }} · Partidos: {{ t.matches }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <q-card class="col-12 col-md-6">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1 text-weight-bold">Usuarios recientes</div>
          <q-btn flat icon="open_in_new" @click="$router.push('/users')" />
        </q-card-section>
        <q-separator />
        <q-list dense>
          <q-item v-for="u in users.slice(0,6)" :key="u.uid" clickable @click="$router.push(`/users/${u.uid}`)">
            <q-item-section avatar>
              <q-avatar size="32px"><img v-if="u.avatar" :src="u.avatar" /></q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ u.displayName || u.email }}</q-item-label>
              <q-item-label caption class="text-uppercase">{{ u.role }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <!-- Tabla mini de próximos partidos -->
    <q-card>
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1 text-weight-bold">Próximos partidos</div>
        <q-btn flat icon="calendar_month" label="Ver calendario" no-caps @click="$router.push('/calendar')" />
      </q-card-section>
      <q-separator />
      <q-table
        :rows="upcomingMatches"
        :columns="columns"
        row-key="id"
        flat
        dense
        hide-bottom
      >
        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn size="sm" flat icon="preview" @click="$router.push(`/matches/${props.row.id}`)" />
            <q-btn size="sm" flat icon="edit" @click="editMatch(props.row.id)" />
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const kpis = ref([
  { icon: 'emoji_events', label: 'Torneos activos', value: 3 },
  { icon: 'groups',       label: 'Equipos',         value: 48 },
  { icon: 'person',       label: 'Usuarios',        value: 612 },
  { icon: 'videocam',     label: 'Videos',          value: 189 }
])

// mocks temporales (luego conectar a Firestore/Veo API)
const tournaments = ref([{ id:'t1', name:'Copa Gol360', teams:16, matches:32 }])
const users = ref([{ uid:'u1', displayName:'Daniel', email:'admin@gol360.com', role:'admin', avatar:'' }])

const upcomingMatches = ref([
  { id:'m1', date:'2025-08-10', time:'15:00', home:'Atlético Norte', away:'Real Central', field:'Cancha 1' },
  { id:'m2', date:'2025-08-12', time:'18:00', home:'Tigres FC', away:'Leones', field:'Cancha 2' }
])

const columns = [
  { name:'date', label:'Fecha', field:'date' },
  { name:'time', label:'Hora',  field:'time' },
  { name:'home', label:'Local', field:'home' },
  { name:'away', label:'Visita',field:'away' },
  { name:'field',label:'Cancha',field:'field' },
  { name:'actions', label:'', field:'actions' }
]

function openCreateTournament(){ /* abrir diálogo/route de nuevo torneo */ }
function editMatch(_id:string){ /* abrir editor */ }
</script>
