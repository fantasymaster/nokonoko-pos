'use client'

import { useState } from 'react'
import { usePOS } from '@/lib/pos-context'
import type { Category, MenuItem } from '@/lib/pos-types'

const BLUE = '#1A28FF'
const CREAM = '#F2EDE4'

function statusFor(stock: number, threshold: number) {
  if (stock === 0) return { label: 'Out of stock', color: '#EF4444' }
  if (stock <= threshold) return { label: 'Low stock', color: '#F59E0B' }
  return { label: 'In stock', color: '#22C55E' }
}

// ── Add Product Modal ──────────────────────────────────────────────────────

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'matcha', label: 'Matcha' },
  { value: 'specialty', label: 'Specialty' },
]

function AddProductModal({ onClose }: { onClose: () => void }) {
  const { addMenuItem } = usePOS()
  const [name, setName] = useState('')
  const [modifier, setModifier] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('specialty')
  const [hasTemperature, setHasTemperature] = useState(true)
  const [hotPrice, setHotPrice] = useState('')
  const [icedPrice, setIcedPrice] = useState('')
  const [fixedPrice, setFixedPrice] = useState('')
  const [stock, setStock] = useState('')
  const [unit, setUnit] = useState('cups')
  const [threshold, setThreshold] = useState('10')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canSave = name.trim() !== '' && (
    hasTemperature
      ? (hotPrice !== '' && icedPrice !== '')
      : fixedPrice !== ''
  ) && stock !== ''

  const handleSave = async () => {
    if (!canSave) { setError('Please fill in all required fields.'); return }
    setSaving(true)
    await addMenuItem({
      name: name.trim(),
      modifier: modifier.trim() || undefined,
      description: description.trim() || undefined,
      category,
      hasTemperature,
      hotPrice: hasTemperature ? Number(hotPrice) : undefined,
      icedPrice: hasTemperature ? Number(icedPrice) : undefined,
      fixedPrice: !hasTemperature ? Number(fixedPrice) : undefined,
      stock: Number(stock),
      unit: unit.trim() || 'cups',
      lowStockThreshold: Number(threshold) || 10,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ backgroundColor: 'rgba(26,40,255,0.12)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'white', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-4 border-b" style={{ borderColor: `${BLUE}10` }}>
          <h2 className="text-xl font-black tracking-tight" style={{ color: BLUE }}>New Product</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-base font-black"
            style={{ backgroundColor: `${BLUE}10`, color: BLUE }}
          >×</button>
        </div>

        <div className="px-7 py-5 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>
              Name *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cappuccino"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
              style={{ borderColor: `${BLUE}20`, color: BLUE }}
            />
          </div>

          {/* Modifier */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>
              Modifier <span style={{ color: `${BLUE}35` }}>(optional)</span>
            </label>
            <input
              value={modifier}
              onChange={e => setModifier(e.target.value)}
              placeholder="e.g. Oat Milk, Large"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
              style={{ borderColor: `${BLUE}20`, color: BLUE }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>
              Description <span style={{ color: `${BLUE}35` }}>(optional)</span>
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Double shot with steamed milk"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
              style={{ borderColor: `${BLUE}20`, color: BLUE }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>
              Category
            </label>
            <div className="flex gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{
                    borderColor: category === c.value ? BLUE : `${BLUE}20`,
                    backgroundColor: category === c.value ? BLUE : 'transparent',
                    color: category === c.value ? CREAM : `${BLUE}60`,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>
              Price Type
            </label>
            <div className="flex gap-2">
              {[{ val: true, label: 'Hot & Iced' }, { val: false, label: 'Fixed Price' }].map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => setHasTemperature(opt.val)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{
                    borderColor: hasTemperature === opt.val ? BLUE : `${BLUE}20`,
                    backgroundColor: hasTemperature === opt.val ? BLUE : 'transparent',
                    color: hasTemperature === opt.val ? CREAM : `${BLUE}60`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prices */}
          {hasTemperature ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Hot RM *</label>
                <input
                  type="number" min="0" value={hotPrice}
                  onChange={e => setHotPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
                  style={{ borderColor: `${BLUE}20`, color: BLUE }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Iced RM *</label>
                <input
                  type="number" min="0" value={icedPrice}
                  onChange={e => setIcedPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
                  style={{ borderColor: `${BLUE}20`, color: BLUE }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Price RM *</label>
              <input
                type="number" min="0" value={fixedPrice}
                onChange={e => setFixedPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
                style={{ borderColor: `${BLUE}20`, color: BLUE }}
              />
            </div>
          )}

          {/* Stock + Unit */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Initial Stock *</label>
              <input
                type="number" min="0" value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
                style={{ borderColor: `${BLUE}20`, color: BLUE }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Unit</label>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="cups"
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
                style={{ borderColor: `${BLUE}20`, color: BLUE }}
              />
            </div>
          </div>

          {/* Low stock threshold */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>
              Low Stock Alert
            </label>
            <input
              type="number" min="1" value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none"
              style={{ borderColor: `${BLUE}20`, color: BLUE }}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 pb-7 pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-black border-2 transition-all hover:opacity-80"
            style={{ borderColor: `${BLUE}20`, color: BLUE }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex-1 py-3.5 rounded-2xl text-sm font-black transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: BLUE, color: CREAM }}
          >
            {saving ? 'Saving…' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Product Modal ─────────────────────────────────────────────────────

function EditProductModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { updateMenuItem } = usePOS()
  const [name, setName] = useState(item.name)
  const [modifier, setModifier] = useState(item.modifier ?? '')
  const [description, setDescription] = useState(item.description ?? '')
  const [category, setCategory] = useState<Category>(item.category)
  const [hasTemperature, setHasTemperature] = useState(item.hasTemperature)
  const [hotPrice, setHotPrice] = useState(String(item.hotPrice ?? ''))
  const [icedPrice, setIcedPrice] = useState(String(item.icedPrice ?? ''))
  const [fixedPrice, setFixedPrice] = useState(String(item.fixedPrice ?? ''))
  const [stock, setStock] = useState(String(item.stock))
  const [unit, setUnit] = useState(item.unit)
  const [threshold, setThreshold] = useState(String(item.lowStockThreshold))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canSave = name.trim() !== '' && (
    hasTemperature ? (hotPrice !== '' && icedPrice !== '') : fixedPrice !== ''
  ) && stock !== ''

  const handleSave = async () => {
    if (!canSave) { setError('Please fill in all required fields.'); return }
    setSaving(true)
    await updateMenuItem(item.id, {
      name: name.trim(),
      modifier: modifier.trim() || undefined,
      description: description.trim() || undefined,
      category,
      hasTemperature,
      hotPrice: hasTemperature ? Number(hotPrice) : undefined,
      icedPrice: hasTemperature ? Number(icedPrice) : undefined,
      fixedPrice: !hasTemperature ? Number(fixedPrice) : undefined,
      stock: Number(stock),
      unit: unit.trim() || 'cups',
      lowStockThreshold: Number(threshold) || 10,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ backgroundColor: 'rgba(26,40,255,0.12)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: 'white', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between px-7 pt-7 pb-4 border-b" style={{ borderColor: `${BLUE}10` }}>
          <h2 className="text-xl font-black tracking-tight" style={{ color: BLUE }}>Edit Product</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-base font-black"
            style={{ backgroundColor: `${BLUE}10`, color: BLUE }}
          >×</button>
        </div>

        <div className="px-7 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cappuccino"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>
              Modifier <span style={{ color: `${BLUE}35` }}>(optional)</span>
            </label>
            <input value={modifier} onChange={e => setModifier(e.target.value)} placeholder="e.g. Oat Milk, Large"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>
              Description <span style={{ color: `${BLUE}35` }}>(optional)</span>
            </label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Double shot with steamed milk"
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{ borderColor: category === c.value ? BLUE : `${BLUE}20`, backgroundColor: category === c.value ? BLUE : 'transparent', color: category === c.value ? CREAM : `${BLUE}60` }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Price Type</label>
            <div className="flex gap-2">
              {[{ val: true, label: 'Hot & Iced' }, { val: false, label: 'Fixed Price' }].map(opt => (
                <button key={String(opt.val)} onClick={() => setHasTemperature(opt.val)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{ borderColor: hasTemperature === opt.val ? BLUE : `${BLUE}20`, backgroundColor: hasTemperature === opt.val ? BLUE : 'transparent', color: hasTemperature === opt.val ? CREAM : `${BLUE}60` }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {hasTemperature ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Hot RM *</label>
                <input type="number" min="0" value={hotPrice} onChange={e => setHotPrice(e.target.value)} placeholder="0"
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Iced RM *</label>
                <input type="number" min="0" value={icedPrice} onChange={e => setIcedPrice(e.target.value)} placeholder="0"
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Price RM *</label>
              <input type="number" min="0" value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} placeholder="0"
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Stock *</label>
              <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0"
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Unit</label>
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="cups"
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: `${BLUE}60` }}>Low Stock Alert</label>
            <input type="number" min="1" value={threshold} onChange={e => setThreshold(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold border-2 outline-none" style={{ borderColor: `${BLUE}20`, color: BLUE }} />
          </div>

          {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
        </div>

        <div className="px-7 pb-7 pt-2 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-black border-2 transition-all hover:opacity-80"
            style={{ borderColor: `${BLUE}20`, color: BLUE }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !canSave}
            className="flex-1 py-3.5 rounded-2xl text-sm font-black transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: BLUE, color: CREAM }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Price Edit Row ─────────────────────────────────────────────────────────

function PriceRow({ itemId, hasTemperature, hotPrice, icedPrice, fixedPrice }: {
  itemId: string
  hasTemperature: boolean
  hotPrice?: number
  icedPrice?: number
  fixedPrice?: number
}) {
  const { updatePrice } = usePOS()
  const [editing, setEditing] = useState(false)
  const [hot, setHot] = useState(String(hotPrice ?? ''))
  const [iced, setIced] = useState(String(icedPrice ?? ''))
  const [fixed, setFixed] = useState(String(fixedPrice ?? ''))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    if (hasTemperature) {
      await updatePrice(itemId, {
        hotPrice: Number(hot) || hotPrice,
        icedPrice: Number(iced) || icedPrice,
      })
    } else {
      await updatePrice(itemId, { fixedPrice: Number(fixed) || fixedPrice })
    }
    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setHot(String(hotPrice ?? ''))
    setIced(String(icedPrice ?? ''))
    setFixed(String(fixedPrice ?? ''))
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: `${BLUE}55` }}>
          {hasTemperature
            ? `Hot RM${hotPrice} · Iced RM${icedPrice}`
            : `RM${fixedPrice}`
          }
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-70 active:scale-95"
          style={{ backgroundColor: `${BLUE}10`, color: BLUE, minHeight: 36 }}
        >
          Edit Price
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {hasTemperature ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[10px] font-bold mb-1" style={{ color: `${BLUE}50` }}>Hot RM</p>
            <input
              type="number" min="0" value={hot}
              onChange={e => setHot(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm font-bold border-2 outline-none"
              style={{ borderColor: BLUE, color: BLUE }}
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold mb-1" style={{ color: `${BLUE}50` }}>Iced RM</p>
            <input
              type="number" min="0" value={iced}
              onChange={e => setIced(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm font-bold border-2 outline-none"
              style={{ borderColor: BLUE, color: BLUE }}
            />
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-bold mb-1" style={{ color: `${BLUE}50` }}>Price RM</p>
          <input
            type="number" min="0" value={fixed}
            onChange={e => setFixed(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm font-bold border-2 outline-none"
            style={{ borderColor: BLUE, color: BLUE }}
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-xs font-black transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BLUE, color: CREAM }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all hover:opacity-70"
          style={{ borderColor: `${BLUE}20`, color: BLUE }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { menu, updateStock } = usePOS()
  const [addInputs, setAddInputs] = useState<Record<string, string>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const outCount = menu.filter(m => m.stock === 0).length
  const lowCount = menu.filter(m => m.stock > 0 && m.stock <= m.lowStockThreshold).length

  const applyAdd = (id: string) => {
    const val = parseInt(addInputs[id] ?? '0', 10)
    if (val > 0) {
      updateStock(id, val)
      setAddInputs(prev => ({ ...prev, [id]: '' }))
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8" style={{ backgroundColor: CREAM }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 sm:mb-7">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.03em]" style={{ color: BLUE }}>
            Inventory
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {outCount > 0 && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                {outCount} out of stock
              </span>
            )}
            {lowCount > 0 && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                {lowCount} low stock
              </span>
            )}
            {outCount === 0 && lowCount === 0 && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
                All stocked
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="mt-1 px-4 py-2.5 rounded-2xl text-sm font-black transition-all hover:opacity-90 active:scale-[0.98] shrink-0"
          style={{ backgroundColor: BLUE, color: CREAM }}
        >
          + Add Product
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {menu.map(item => {
          const displayName = item.modifier ? `${item.name} ${item.modifier}` : item.name
          const { label, color } = statusFor(item.stock, item.lowStockThreshold)
          const maxDisplay = item.lowStockThreshold * 6
          const barPct = Math.min(100, item.stock > 0 ? (item.stock / maxDisplay) * 100 : 0)

          return (
            <div key={item.id} className="rounded-2xl p-5 sm:p-6 flex flex-col gap-4" style={{ backgroundColor: 'white' }}>
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black tracking-tight leading-none" style={{ color: BLUE }}>
                    {displayName}
                  </h3>
                  <p className="text-xs mt-1 capitalize font-medium" style={{ color: `${BLUE}45` }}>
                    {item.category}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    {label}
                  </span>
                  <button
                    onClick={() => setEditingItem(item)}
                    className="text-xs font-bold px-3 py-2 rounded-xl transition-all hover:opacity-70 active:scale-95"
                    style={{ backgroundColor: `${BLUE}10`, color: BLUE, minHeight: 36 }}
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Stock count */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black leading-none" style={{ color: item.stock === 0 ? '#EF4444' : BLUE }}>
                  {item.stock}
                </span>
                <span className="text-sm font-medium" style={{ color: `${BLUE}45` }}>{item.unit}</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${BLUE}10` }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${barPct}%`, backgroundColor: color }}
                />
              </div>

              {/* Price row */}
              <PriceRow
                itemId={item.id}
                hasTemperature={item.hasTemperature}
                hotPrice={item.hotPrice}
                icedPrice={item.icedPrice}
                fixedPrice={item.fixedPrice}
              />

              {/* Quick ±1 controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStock(item.id, -1)}
                  disabled={item.stock === 0}
                  className="w-11 h-11 rounded-full font-black text-xl flex items-center justify-center transition-all hover:opacity-70 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                  style={{ backgroundColor: `${BLUE}10`, color: BLUE }}
                >−</button>
                <button
                  onClick={() => updateStock(item.id, 1)}
                  className="w-11 h-11 rounded-full font-black text-xl flex items-center justify-center transition-all hover:opacity-70 active:scale-95"
                  style={{ backgroundColor: `${BLUE}10`, color: BLUE }}
                >+</button>
                <div className="flex flex-1 items-center gap-1.5 ml-1">
                  <input
                    type="number" min="1" placeholder="Qty"
                    value={addInputs[item.id] ?? ''}
                    onChange={e => setAddInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && applyAdd(item.id)}
                    className="flex-1 min-w-0 rounded-xl px-3 py-3 text-sm font-semibold border outline-none"
                    style={{ borderColor: `${BLUE}20`, color: BLUE, backgroundColor: `${BLUE}04` }}
                  />
                  <button
                    onClick={() => applyAdd(item.id)}
                    className="px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-80 active:scale-95 shrink-0"
                    style={{ backgroundColor: BLUE, color: CREAM }}
                  >Add</button>
                </div>
              </div>

              <p className="text-[10px] font-medium -mt-1" style={{ color: `${BLUE}35` }}>
                Alert below {item.lowStockThreshold} {item.unit}
              </p>
            </div>
          )
        })}
      </div>

      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
      {editingItem && <EditProductModal item={editingItem} onClose={() => setEditingItem(null)} />}
    </div>
  )
}
