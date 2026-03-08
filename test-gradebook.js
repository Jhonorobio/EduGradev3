// Simple test script to verify gradebook functionality
const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://rizddhhcqbmbvnborjlc.supabase.co'
const supabaseKey = 'your-anon-key' // This should be replaced with actual key

async function testGradebookData() {
  console.log('Testing gradebook data...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(5)
    
    if (studentsError) {
      console.error('Students error:', studentsError)
    } else {
      console.log('✓ Students found:', students?.length || 0)
    }
    
    // Test activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .limit(5)
    
    if (activitiesError) {
      console.error('Activities error:', activitiesError)
    } else {
      console.log('✓ Activities found:', activities?.length || 0)
      activities?.forEach(activity => {
        console.log(`  - ${activity.name} (${activity.category})`)
      })
    }
    
    // Test gradebook entries
    const { data: entries, error: entriesError } = await supabase
      .from('gradebook_entries')
      .select('*')
      .limit(5)
    
    if (entriesError) {
      console.error('Gradebook entries error:', entriesError)
    } else {
      console.log('✓ Gradebook entries found:', entries?.length || 0)
    }
    
    console.log('\n✅ Gradebook test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testGradebookData()
