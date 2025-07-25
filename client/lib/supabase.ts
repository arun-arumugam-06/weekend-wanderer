import { createClient } from '@supabase/supabase-js'

// These would typically come from environment variables
// For demo purposes, using placeholder values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key-placeholder'

// Check if we're in demo mode (no real Supabase credentials)
export const isDemoMode = supabaseUrl.includes('demo-project') || supabaseAnonKey.includes('demo')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript support
export interface DatabaseUser {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface DatabaseItinerary {
  id: string
  user_id: string
  location: string
  start_date: string
  end_date: string
  items: any // JSON field
  total_cost: number
  is_favorite: boolean
  created_at: string
  updated_at: string
}

// In-memory storage for demo mode
let demoUsers: DatabaseUser[] = []
let demoItineraries: DatabaseItinerary[] = []

// Helper functions for database operations
export const dbHelpers = {
  // User operations
  async createUser(userData: { email: string; name: string; id: string }) {
    if (isDemoMode) {
      const newUser: DatabaseUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      demoUsers.push(newUser)
      console.log('🔧 Demo mode: Created user in memory storage')
      return newUser
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userData.id,
        email: userData.email,
        name: userData.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUser(userId: string) {
    if (isDemoMode) {
      const user = demoUsers.find(u => u.id === userId)
      if (!user) throw new Error('User not found')
      return user
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  // Itinerary operations
  async createItinerary(itineraryData: any) {
    if (isDemoMode) {
      const newItinerary: DatabaseItinerary = {
        ...itineraryData,
        id: `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      demoItineraries.push(newItinerary)
      console.log('🔧 Demo mode: Created itinerary in memory storage')
      return newItinerary
    }

    const { data, error } = await supabase
      .from('itineraries')
      .insert([{
        ...itineraryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUserItineraries(userId: string) {
    if (isDemoMode) {
      return demoItineraries
        .filter(i => i.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async updateItinerary(id: string, updates: Partial<DatabaseItinerary>) {
    if (isDemoMode) {
      const index = demoItineraries.findIndex(i => i.id === id)
      if (index === -1) throw new Error('Itinerary not found')

      demoItineraries[index] = {
        ...demoItineraries[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      return demoItineraries[index]
    }

    const { data, error } = await supabase
      .from('itineraries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteItinerary(id: string) {
    if (isDemoMode) {
      const index = demoItineraries.findIndex(i => i.id === id)
      if (index === -1) throw new Error('Itinerary not found')
      demoItineraries.splice(index, 1)
      return
    }

    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
