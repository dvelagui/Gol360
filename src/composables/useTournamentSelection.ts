import { ref, watch, type Ref } from 'vue'
import type { Tournament } from '@/types/auth'

const STORAGE_KEY = 'gol360_selected_tournament'

/**
 * Composable para manejar la selección y persistencia del torneo
 * Guarda la selección en localStorage para recordarla entre páginas
 */
export function useTournamentSelection(tournaments: Ref<Tournament[]>) {
  const selectedTournament = ref<Tournament | null>(null)

  /**
   * Carga el torneo guardado en localStorage
   * Si existe y está en la lista, lo selecciona automáticamente
   */
  function loadSavedTournament() {
    const savedId = localStorage.getItem(STORAGE_KEY)

    if (savedId && tournaments.value.length > 0) {
      const found = tournaments.value.find(t => t.tournamentId === savedId)
      if (found) {
        selectedTournament.value = found
        return true
      }
    }

    return false
  }

  /**
   * Guarda el torneo seleccionado en localStorage
   */
  function saveTournament(tournament: Tournament | null) {
    if (tournament) {
      localStorage.setItem(STORAGE_KEY, tournament.tournamentId)
      selectedTournament.value = tournament
    } else {
      localStorage.removeItem(STORAGE_KEY)
      selectedTournament.value = null
    }
  }

  /**
   * Inicializa la selección:
   * 1. Intenta cargar el torneo guardado
   * 2. Si no hay guardado, selecciona el primero disponible
   */
  function initializeSelection() {
    if (tournaments.value.length === 0) {
      selectedTournament.value = null
      return
    }

    // Intentar cargar el torneo guardado
    const loaded = loadSavedTournament()

    // Si no se cargó ninguno guardado, seleccionar el primero
    if (!loaded && tournaments.value.length > 0) {
      saveTournament(tournaments.value[0] ?? null)
    }
  }

  /**
   * Actualiza la selección y guarda en localStorage
   */
  function updateSelection(tournament: Tournament) {
    saveTournament(tournament)
  }

  /**
   * Limpia la selección guardada
   */
  function clearSelection() {
    saveTournament(null)
  }

  // Watch para reinicializar cuando cambie la lista de torneos
  watch(
    () => tournaments.value.length,
    () => {
      initializeSelection()
    },
    { immediate: true }
  )

  return {
    selectedTournament,
    updateSelection,
    clearSelection,
    initializeSelection
  }
}
