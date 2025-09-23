"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Car, Truck, Bus, PowerCircle as Motorcycle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Category {
  code: string
  name: string
  description: string
}

interface CategorySelectionModalProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  onComplete: (selectedCategories: string[]) => void
}

const getCategoryIcon = (code: string) => {
  if (code.includes("A")) return Motorcycle
  if (code.includes("B")) return Car
  if (code.includes("C")) return Truck
  if (code.includes("D")) return Bus
  return Car
}

export function CategorySelectionModal({ open, onClose, categories, onComplete }: CategorySelectionModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleCategory = (categoryCode: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryCode) ? prev.filter((c) => c !== categoryCode) : [...prev, categoryCode],
    )
  }

  const handleComplete = async () => {
    if (selectedCategories.length === 0) return

    setLoading(true)
    try {
      const supabase = createClient()
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Save favorite categories
      const favoriteInserts = selectedCategories.map((categoryCode) => ({
        user_id: user.id,
        category_code: categoryCode,
      }))

      await supabase.from("user_favorite_categories").insert(favoriteInserts)

      // Mark onboarding as completed
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id)

      onComplete(selectedCategories)
    } catch (error) {
      console.error("Error saving favorite categories:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">¡Bienvenido a AutoTest Pro!</DialogTitle>
          <DialogDescription className="text-lg">
            Selecciona las categorías que más te interesan para personalizarlas como favoritas
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.code)
            const isSelected = selectedCategories.includes(category.code)

            return (
              <Card
                key={category.code}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => toggleCategory(category.code)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="secondary">{category.code}</Badge>
                    </div>
                    {isSelected && (
                      <div className="p-1 bg-primary rounded-full">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">{selectedCategories.length} categorías seleccionadas</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedCategories([])}>
              Limpiar
            </Button>
            <Button onClick={handleComplete} disabled={selectedCategories.length === 0 || loading}>
              {loading ? "Guardando..." : "Continuar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
