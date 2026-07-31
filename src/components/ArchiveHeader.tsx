import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFiltersStore } from '@/store/filters'
import { cn } from '@/lib/utils'

export function ArchiveHeader() {
  const entityType = useFiltersStore((s) => s.entityType)
  const setEntityType = useFiltersStore((s) => s.setEntityType)
  const studentCategory = useFiltersStore((s) => s.studentCategory)
  const setStudentCategory = useFiltersStore((s) => s.setStudentCategory)
  const darkMode = useFiltersStore((s) => s.darkMode)
  const toggleDarkMode = useFiltersStore((s) => s.toggleDarkMode)
  const focusPerson = useFiltersStore((s) => s.focusPerson)

  const showStudentFilters = entityType === 'students'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-6">
          Digital Archive of RTU Architecture Drawing Collection
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Frontend prototype • JSON data source • Filterable archive view
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!focusPerson ? (
            <Tabs value={entityType} onValueChange={(v) => setEntityType(v as any)}>
              <TabsList>
                <TabsTrigger value="all">ALL</TabsTrigger>
                <TabsTrigger value="students">STUDENTS</TabsTrigger>
                <TabsTrigger value="teachers">TEACHERS</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun /> : <Moon />}
          </Button>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {!focusPerson && showStudentFilters ? (
            <>
              <Button
                type="button"
                size="sm"
                variant={studentCategory === 'graduated' ? 'default' : 'outline'}
                onClick={() =>
                  setStudentCategory(studentCategory === 'graduated' ? null : 'graduated')
                }
                className={cn('flex-1 sm:flex-none')}
              >
                Graduated
              </Button>
              <Button
                type="button"
                size="sm"
                variant={studentCategory === 'undergraduate' ? 'default' : 'outline'}
                onClick={() =>
                  setStudentCategory(studentCategory === 'undergraduate' ? null : 'undergraduate')
                }
                className={cn('flex-1 sm:flex-none')}
              >
                Undergraduate
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

