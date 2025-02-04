import { RateCard, Topic } from '../types'
import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface ServicesStepProps {
  currentTopic: string
  setCurrentTopic: (topic: string) => void
  topics: Topic[]
  setTopics: (topics: Topic[]) => void
  selectedRateCard: string
  rateCards: RateCard[]
  selectedCategories: { [topicId: string]: string }
  setSelectedCategories: (categories: { [topicId: string]: string }) => void
  newCategoryNames: { [topicId: string]: string }
  setNewCategoryNames: (names: { [topicId: string]: string }) => void
  newServiceNames: { [categoryId: string]: string }
  setNewServiceNames: (names: { [categoryId: string]: string }) => void
  newServiceUnits: { [categoryId: string]: string }
  setNewServiceUnits: (units: { [categoryId: string]: string }) => void
  newServicePrices: { [categoryId: string]: string }
  setNewServicePrices: (prices: { [categoryId: string]: string }) => void
  calculateCategoryTotal: (services: any[]) => number
  calculateTopicTotal: (topic: Topic) => number
}

export default function ServicesStep({
  currentTopic,
  setCurrentTopic,
  topics,
  setTopics,
  selectedRateCard,
  rateCards,
  selectedCategories,
  setSelectedCategories,
  newCategoryNames,
  setNewCategoryNames,
  newServiceNames,
  setNewServiceNames,
  newServiceUnits,
  setNewServiceUnits,
  newServicePrices,
  setNewServicePrices,
  calculateCategoryTotal,
  calculateTopicTotal
}: ServicesStepProps) {
  const [selectedServices, setSelectedServices] = useState<{ [categoryId: string]: string }>({})
  const [serviceDays, setServiceDays] = useState<{ [serviceId: string]: number }>({})
  const [serviceQuantities, setServiceQuantities] = useState<{ [serviceId: string]: number }>({})
  const [servicePrices, setServicePrices] = useState<{ [serviceId: string]: number }>({})
  const [collapsedTopics, setCollapsedTopics] = useState<{ [key: string]: boolean }>({})
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnd = (result: any) => {
    const { source, destination, type } = result

    if (!destination) return

    // Eğer aynı yere bırakıldıysa bir şey yapma
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Konular arası taşıma
    if (type === 'topic') {
      const newTopics = Array.from(topics)
      const [removed] = newTopics.splice(source.index, 1)
      newTopics.splice(destination.index, 0, removed)
      setTopics(newTopics)
      return
    }

    // Kategoriler arası taşıma
    if (type === 'category') {
      const sourceTopicId = source.droppableId.replace('topic-', '')
      const destTopicId = destination.droppableId.replace('topic-', '')
      
      const sourceTopic = topics.find(t => t.id === sourceTopicId)
      const destTopic = topics.find(t => t.id === destTopicId)
      
      if (!sourceTopic || !destTopic) return

      const newTopics = topics.map(topic => {
        if (topic.id === sourceTopicId) {
          const newCategories = [...topic.categories]
          const [removed] = newCategories.splice(source.index, 1)
          
          if (sourceTopicId === destTopicId) {
            newCategories.splice(destination.index, 0, removed)
            return { ...topic, categories: newCategories }
          }
          
          return { ...topic, categories: newCategories }
        }
        
        if (topic.id === destTopicId) {
          const newCategories = [...topic.categories]
          const [categoryToAdd] = sourceTopic.categories.slice(source.index, source.index + 1)
          newCategories.splice(destination.index, 0, categoryToAdd)
          return { ...topic, categories: newCategories }
        }
        
        return topic
      })
      
      setTopics(newTopics)
      return
    }

    // Hizmetler arası taşıma
    if (type === 'service') {
      const [sourceTopicId, sourceCategoryId] = source.droppableId.split('-')
      const [destTopicId, destCategoryId] = destination.droppableId.split('-')
      
      const newTopics = topics.map(topic => {
        if (topic.id === sourceTopicId) {
          return {
            ...topic,
            categories: topic.categories.map(category => {
              if (category.id === sourceCategoryId) {
                const newServices = [...category.services]
                const [removed] = newServices.splice(source.index, 1)
                
                if (sourceCategoryId === destCategoryId) {
                  newServices.splice(destination.index, 0, removed)
                  return { ...category, services: newServices }
                }
                
                return { ...category, services: newServices }
              }
              
              if (topic.id === destTopicId && category.id === destCategoryId) {
                const sourceCategory = topic.categories.find(c => c.id === sourceCategoryId)
                if (!sourceCategory) return category
                
                const newServices = [...category.services]
                const [serviceToAdd] = sourceCategory.services.slice(source.index, source.index + 1)
                newServices.splice(destination.index, 0, serviceToAdd)
                return { ...category, services: newServices }
              }
              
              return category
            })
          }
        }
        
        if (topic.id === destTopicId && topic.id !== sourceTopicId) {
          return {
            ...topic,
            categories: topic.categories.map(category => {
              if (category.id === destCategoryId) {
                const sourceTopic = topics.find(t => t.id === sourceTopicId)
                if (!sourceTopic) return category
                
                const sourceCategory = sourceTopic.categories.find(c => c.id === sourceCategoryId)
                if (!sourceCategory) return category
                
                const newServices = [...category.services]
                const [serviceToAdd] = sourceCategory.services.slice(source.index, source.index + 1)
                newServices.splice(destination.index, 0, serviceToAdd)
                return { ...category, services: newServices }
              }
              return category
            })
          }
        }
        
        return topic
      })
      
      setTopics(newTopics)
    }
  }

  const handleDragUpdate = (update: any) => {
    const { source, destination } = update;
    if (!destination) return;

    // Mobil cihazlar için daha hassas scroll kontrolü
    const threshold = window.innerWidth < 640 ? 100 : 200; // sm breakpoint için 640px
    const scrollSpeed = window.innerWidth < 640 ? 5 : 10; // Mobilde daha yavaş scroll
    const viewportHeight = window.innerHeight;
    const mousePosition = update.clientY;

    if (mousePosition < threshold) {
      window.scrollBy(0, -scrollSpeed);
    } else if (mousePosition > viewportHeight - threshold) {
      window.scrollBy(0, scrollSpeed);
    }
  }

  const addTopic = () => {
    if (!currentTopic.trim()) return

    const newTopic = {
      id: Date.now().toString(),
      name: currentTopic.trim(),
      categories: []
    }

    setTopics([...topics, newTopic])
    setCurrentTopic('')
  }

  const updateTopic = (id: string, newName: string) => {
    setTopics(
      topics.map((topic) =>
        topic.id === id ? { ...topic, name: newName } : topic
      )
    )
  }

  const addCustomCategory = (topicId: string) => {
    if (!newCategoryNames[topicId]?.trim()) return

    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return

    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryNames[topicId].trim(),
      isCustom: true,
      services: []
    }

    setTopics(
      topics.map((t) =>
        t.id === topicId
          ? { ...t, categories: [...(t.categories || []), newCategory] }
          : t
      )
    )

    setNewCategoryNames({ ...newCategoryNames, [topicId]: '' })
  }

  const addCustomService = (topicId: string, categoryId: string) => {
    if (!newServiceNames[categoryId]?.trim()) return

    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return

    const category = topic.categories.find((c) => c.id === categoryId)
    if (!category) return

    const price = parseFloat(newServicePrices[categoryId]) || 0
    const quantity = serviceQuantities[categoryId] || 1
    const days = serviceDays[categoryId] || 1
    const totalPrice = price * quantity * days

    const newService = {
      id: Date.now().toString(),
      name: newServiceNames[categoryId].trim(),
      unit: newServiceUnits[categoryId] || 'adet',
      price: price,
      days: days,
      quantity: quantity,
      totalPrice: totalPrice,
      isCustom: true
    }

    setTopics(
      topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              categories: t.categories.map((c) =>
                c.id === categoryId
                  ? { ...c, services: [...(c.services || []), newService] }
                  : c
              )
            }
          : t
      )
    )

    setNewServiceNames({ ...newServiceNames, [categoryId]: '' })
    setNewServiceUnits({ ...newServiceUnits, [categoryId]: '' })
    setNewServicePrices({ ...newServicePrices, [categoryId]: '' })
    setServiceDays({ ...serviceDays, [categoryId]: 1 })
    setServiceQuantities({ ...serviceQuantities, [categoryId]: 1 })
  }

  const handleServiceSelect = (categoryId: string, serviceId: string) => {
    setSelectedServices({ ...selectedServices, [categoryId]: serviceId });
    
    if (serviceId !== 'custom') {
      const rateCard = rateCards.find((rc) => rc.id === selectedRateCard);
      const category = rateCard?.categories.find((c) => c.name === topics.find(t => 
        t.categories.find(cat => cat.id === categoryId)
      )?.categories.find(cat => cat.id === categoryId)?.name);
      const service = category?.services.find((s) => s.id === serviceId);
      
      if (service) {
        setServicePrices({ ...servicePrices, [serviceId]: service.price });
      }
    }
  };

  const addSelectedService = (e: React.MouseEvent, topicId: string, categoryId: string) => {
    e.preventDefault();
    const selectedServiceId = selectedServices[categoryId]
    if (!selectedServiceId) return

    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return

    const category = topic.categories.find(c => c.id === categoryId)
    if (!category) return

    const rateCard = rateCards.find((rc) => rc.id === selectedRateCard)
    if (!rateCard) return

    const selectedCategory = rateCard.categories.find((c) => c.name === category.name)
    if (!selectedCategory) return

    const selectedService = selectedCategory.services.find((s) => s.id === selectedServiceId)
    if (!selectedService) return

    const days = serviceDays[selectedServiceId] || 1;
    const quantity = serviceQuantities[selectedServiceId] || 1;
    const price = servicePrices[selectedServiceId] || selectedService.price;
    const totalPrice = days * quantity * price;

    setTopics(
      topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              categories: t.categories.map((c) =>
                c.id === categoryId
                  ? {
                      ...c,
                      services: [
                        ...(c.services || []),
                        {
                          ...selectedService,
                          id: Date.now().toString(),
                          days: days,
                          quantity: quantity,
                          price: price,
                          totalPrice: totalPrice,
                        }
                      ],
                    }
                  : c
              ),
            }
          : t
      )
    );

    setSelectedServices({ ...selectedServices, [categoryId]: '' });
    setServiceDays({ ...serviceDays, [selectedServiceId]: 1 });
    setServiceQuantities({ ...serviceQuantities, [selectedServiceId]: 1 });
    setServicePrices({ ...servicePrices, [selectedServiceId]: selectedService.price });
  };

  const removeCategory = (topicId: string, categoryId: string) => {
    setTopics(
      topics.map((t) =>
        t.id === topicId
          ? { ...t, categories: t.categories.filter((c) => c.id !== categoryId) }
          : t
      )
    )
  }

  const calculateGrandTotal = () => {
    return topics.reduce((total, topic) => {
      return total + calculateTopicTotal(topic)
    }, 0)
  }

  const toggleCollapse = (topicId: string) => {
    setCollapsedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }))
  }

  return (
    <div>
      <DragDropContext 
        onDragEnd={handleDragEnd}
        onDragUpdate={handleDragUpdate}
      >
        <Droppable droppableId="topics" type="topic">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {topics.map((topic, topicIndex) => (
                <Draggable key={topic.id} draggableId={topic.id} index={topicIndex}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="mb-3 bg-white rounded-lg shadow"
                      style={provided.draggableProps.style}
                    >
                      <div className={`py-1.5 px-3 border-b border-gray-200 ${snapshot.isDragging ? 'border-none' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                            </svg>
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <input
                              type="text"
                              value={topic.name}
                              onChange={(e) => updateTopic(topic.id, e.target.value)}
                              className="flex-1 py-1.5 px-3 text-base border rounded"
                              placeholder="Konu Başlığı"
                            />
                            <div className="text-sm font-medium text-gray-600">
                              {calculateTopicTotal(topic).toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                              })}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();  // Event'in yukarı yayılmasını engelleyeceğiz
                              toggleCollapse(topic.id);
                            }}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title={collapsedTopics[topic.id] ? "Genişlet" : "Daralt"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`transform transition-transform ${collapsedTopics[topic.id] ? 'rotate-180' : ''}`}
                            >
                              <path d="M18 15l-6-6-6 6"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setTopics(topics.filter((t) => t.id !== topic.id))
                            }}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Sil
                          </button>
                        </div>
                      </div>

                      <div className={`transition-all duration-200 ${collapsedTopics[topic.id] ? 'hidden' : ''}`}>
                        <Droppable droppableId={`topic-${topic.id}`} type="category">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                              {topic.categories.map((category, categoryIndex) => (
                                <Draggable
                                  key={category.id}
                                  draggableId={category.id}
                                  index={categoryIndex}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`mt-2 py-2 px-3 border rounded ${snapshot.isDragging ? 'opacity-70' : ''}`}
                                      style={provided.draggableProps.style}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition-colors"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                                            </svg>
                                          </div>
                                          <h3 className="text-sm font-medium">{category.name}</h3>
                                        </div>
                                        <button
                                          onClick={() => removeCategory(topic.id, category.id)}
                                          className="text-red-500 hover:text-red-600 text-xs"
                                        >
                                          Sil
                                        </button>
                                      </div>

                                      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-3 mb-2">
                                        {category.isCustom ? (
                                          <>
                                            <input
                                              type="text"
                                              value={newServiceNames[category.id] || ''}
                                              onChange={(e) =>
                                                setNewServiceNames({
                                                  ...newServiceNames,
                                                  [category.id]: e.target.value
                                                })
                                              }
                                              placeholder="Özel Hizmet Adı"
                                              className="w-full sm:w-[500px] py-1.5 px-3 text-sm border rounded"
                                            />
                                            <div className="w-28">
                                              <div className="text-xs text-gray-500 mb-1.5">Gün</div>
                                              <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={serviceDays[category.id]?.toString() || '1'}
                                                onChange={(e) => {
                                                  const value = parseFloat(e.target.value) || 1;
                                                  setServiceDays({
                                                    ...serviceDays,
                                                    [category.id]: value
                                                  });
                                                }}
                                                className="w-full py-1.5 px-3 text-sm border rounded"
                                                placeholder="Gün"
                                              />
                                            </div>
                                            <div className="w-28">
                                              <div className="text-xs text-gray-500 mb-1.5">Adet</div>
                                              <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={serviceQuantities[category.id]?.toString() || '1'}
                                                onChange={(e) => {
                                                  const value = parseFloat(e.target.value) || 1;
                                                  setServiceQuantities({
                                                    ...serviceQuantities,
                                                    [category.id]: value
                                                  });
                                                }}
                                                className="w-full py-1.5 px-3 text-sm border rounded"
                                                placeholder="Adet"
                                              />
                                            </div>
                                            <div className="w-36">
                                              <div className="text-xs text-gray-500 mb-1.5">Birim Fiyat</div>
                                              <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={newServicePrices[category.id] || ''}
                                                onChange={(e) =>
                                                  setNewServicePrices({
                                                    ...newServicePrices,
                                                    [category.id]: e.target.value
                                                  })
                                                }
                                                placeholder="Birim Fiyat"
                                                className="w-full py-1.5 px-3 text-sm border rounded"
                                              />
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500 mb-1.5 invisible">Aksiyon</div>
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  addCustomService(topic.id, category.id);
                                                }}
                                                className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                              >
                                                Ekle
                                              </button>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <select
                                              value={selectedServices[category.id] || ''}
                                              onChange={(e) => handleServiceSelect(category.id, e.target.value)}
                                              className="w-full sm:w-[500px] py-1.5 px-3 text-sm border rounded"
                                            >
                                              <option value="">Hizmet Seç</option>
                                              <option value="custom">+ Özel Hizmet Ekle</option>
                                              {rateCards
                                                .find((rc) => rc.id === selectedRateCard)
                                                ?.categories.find((c) => c.name === category.name)
                                                ?.services.map((service) => (
                                                  <option key={service.id} value={service.id}>
                                                    {service.name}
                                                  </option>
                                                ))}
                                            </select>
                                            {selectedServices[category.id] === 'custom' ? (
                                              <>
                                                <input
                                                  type="text"
                                                  value={newServiceNames[category.id] || ''}
                                                  onChange={(e) =>
                                                    setNewServiceNames({
                                                      ...newServiceNames,
                                                      [category.id]: e.target.value
                                                    })
                                                  }
                                                  placeholder="Özel Hizmet Adı"
                                                  className="w-full sm:w-[500px] py-1.5 px-3 text-sm border rounded"
                                                />
                                                <div className="w-28">
                                                  <div className="text-xs text-gray-500 mb-1.5">Gün</div>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={serviceDays[category.id]?.toString() || '1'}
                                                    onChange={(e) => {
                                                      const value = parseFloat(e.target.value) || 1;
                                                      setServiceDays({
                                                        ...serviceDays,
                                                        [category.id]: value
                                                      });
                                                    }}
                                                    className="w-full py-1.5 px-3 text-sm border rounded"
                                                    placeholder="Gün"
                                                  />
                                                </div>
                                                <div className="w-28">
                                                  <div className="text-xs text-gray-500 mb-1.5">Adet</div>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={serviceQuantities[category.id]?.toString() || '1'}
                                                    onChange={(e) => {
                                                      const value = parseFloat(e.target.value) || 1;
                                                      setServiceQuantities({
                                                        ...serviceQuantities,
                                                        [category.id]: value
                                                      });
                                                    }}
                                                    className="w-full py-1.5 px-3 text-sm border rounded"
                                                    placeholder="Adet"
                                                  />
                                                </div>
                                                <div className="w-36">
                                                  <div className="text-xs text-gray-500 mb-1.5">Birim Fiyat</div>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={newServicePrices[category.id] || ''}
                                                    onChange={(e) =>
                                                      setNewServicePrices({
                                                        ...newServicePrices,
                                                        [category.id]: e.target.value
                                                      })
                                                    }
                                                    placeholder="Birim Fiyat"
                                                    className="w-full py-1.5 px-3 text-sm border rounded"
                                                  />
                                                </div>
                                              </>
                                            ) : (
                                              <>
                                                <div className="w-28">
                                                  <div className="text-xs text-gray-500 mb-1.5">Gün</div>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={serviceDays[selectedServices[category.id]]?.toString() || '1'}
                                                    onChange={(e) => {
                                                      const value = parseFloat(e.target.value) || 1;
                                                      setServiceDays({
                                                        ...serviceDays,
                                                        [selectedServices[category.id]]: value
                                                      });
                                                    }}
                                                    className="w-full py-1.5 px-3 text-sm border rounded"
                                                    placeholder="Gün"
                                                  />
                                                </div>
                                                <div className="w-28">
                                                  <div className="text-xs text-gray-500 mb-1.5">Adet</div>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={serviceQuantities[selectedServices[category.id]]?.toString() || '1'}
                                                    onChange={(e) => {
                                                      const value = parseFloat(e.target.value) || 1;
                                                      setServiceQuantities({
                                                        ...serviceQuantities,
                                                        [selectedServices[category.id]]: value
                                                      });
                                                    }}
                                                    className="w-full py-1.5 px-3 text-sm border rounded"
                                                    placeholder="Adet"
                                                  />
                                                </div>
                                                <div className="w-36">
                                                  <div className="text-xs text-gray-500 mb-1.5">Birim Fiyat</div>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={servicePrices[selectedServices[category.id]]?.toString() || ''}
                                                    onChange={(e) => {
                                                      const value = parseFloat(e.target.value) || 0;
                                                      setServicePrices({
                                                        ...servicePrices,
                                                        [selectedServices[category.id]]: value
                                                      });
                                                    }}
                                                    className="w-full py-1.5 px-3 text-sm border rounded"
                                                    placeholder="Birim Fiyat"
                                                  />
                                                </div>
                                              </>
                                            )}
                                            <div>
                                              <div className="text-xs text-gray-500 mb-1.5 invisible">Aksiyon</div>
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  if (selectedServices[category.id] === 'custom') {
                                                    addCustomService(topic.id, category.id);
                                                  } else {
                                                    addSelectedService(e, topic.id, category.id);
                                                  }
                                                }}
                                                className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                              >
                                                Ekle
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      <div className="mt-2">
                                        <h4 className="text-sm font-medium mb-2">Eklenen Hizmetler:</h4>
                                        <Droppable droppableId={`${topic.id}-${category.id}`} type="service">
                                          {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                              {category.services.map((service, serviceIndex) => (
                                                <Draggable
                                                  key={service.id}
                                                  draggableId={service.id}
                                                  index={serviceIndex}
                                                >
                                                  {(provided, snapshot) => (
                                                    <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      className={`flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-3 mb-2 py-1.5 px-3 bg-gray-50 rounded text-sm ${
                                                        snapshot.isDragging ? 'opacity-70' : ''
                                                      }`}
                                                      style={provided.draggableProps.style}
                                                    >
                                                      <div
                                                        {...provided.dragHandleProps}
                                                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors self-start sm:self-center"
                                                      >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                          <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                                                        </svg>
                                                      </div>
                                                      <div className="w-full sm:w-[500px]">
                                                        <div className="text-xs text-gray-500 mb-1.5">Hizmet Adı</div>
                                                        <input
                                                          type="text"
                                                          value={service.name}
                                                          onChange={(e) => {
                                                            setTopics(
                                                              topics.map((t) =>
                                                                t.id === topic.id
                                                                  ? {
                                                                      ...t,
                                                                      categories: t.categories.map((c) =>
                                                                        c.id === category.id
                                                                          ? {
                                                                              ...c,
                                                                              services: c.services.map((s) =>
                                                                                s.id === service.id
                                                                                  ? { ...s, name: e.target.value }
                                                                                  : s
                                                                              ),
                                                                            }
                                                                          : c
                                                                      ),
                                                                    }
                                                                  : t
                                                              )
                                                            );
                                                          }}
                                                          className="w-full py-1.5 px-3 text-sm border rounded"
                                                        />
                                                      </div>
                                                      <div className="w-24">
                                                        <div className="text-xs text-gray-500 mb-1.5">Gün</div>
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          step="any"
                                                          value={service.days}
                                                          onChange={(e) => {
                                                            const value = parseFloat(e.target.value) || 0;
                                                            setTopics(
                                                              topics.map((t) =>
                                                                t.id === topic.id
                                                                  ? {
                                                                      ...t,
                                                                      categories: t.categories.map((c) =>
                                                                        c.id === category.id
                                                                          ? {
                                                                              ...c,
                                                                              services: c.services.map((s) =>
                                                                                s.id === service.id
                                                                                  ? {
                                                                                      ...s,
                                                                                      days: value,
                                                                                      totalPrice: value * s.quantity * s.price
                                                                                    }
                                                                                  : s
                                                                              )
                                                                            }
                                                                          : c
                                                                      ),
                                                                    }
                                                                  : t
                                                              )
                                                            );
                                                          }}
                                                          className="w-full py-1.5 px-3 text-sm border rounded"
                                                        />
                                                      </div>
                                                      <div className="w-24">
                                                        <div className="text-xs text-gray-500 mb-1.5">Adet</div>
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          step="any"
                                                          value={service.quantity}
                                                          onChange={(e) => {
                                                            const value = parseFloat(e.target.value) || 0;
                                                            setTopics(
                                                              topics.map((t) =>
                                                                t.id === topic.id
                                                                  ? {
                                                                      ...t,
                                                                      categories: t.categories.map((c) =>
                                                                        c.id === category.id
                                                                          ? {
                                                                              ...c,
                                                                              services: c.services.map((s) =>
                                                                                s.id === service.id
                                                                                  ? {
                                                                                      ...s,
                                                                                      quantity: value,
                                                                                      totalPrice: s.days * value * s.price
                                                                                    }
                                                                                  : s
                                                                              )
                                                                            }
                                                                          : c
                                                                      ),
                                                                    }
                                                                  : t
                                                              )
                                                            );
                                                          }}
                                                          className="w-full py-1.5 px-3 text-sm border rounded"
                                                        />
                                                      </div>
                                                      <div className="w-32">
                                                        <div className="text-xs text-gray-500 mb-1.5">Birim Fiyat</div>
                                                        <input
                                                          type="text"
                                                          pattern="[0-9]*[.,]?[0-9]*"
                                                          value={service.price}
                                                          onChange={(e) => {
                                                            const value = parseFloat(e.target.value.replace(',', '.')) || 0;
                                                            setTopics(
                                                              topics.map((t) =>
                                                                t.id === topic.id
                                                                  ? {
                                                                      ...t,
                                                                      categories: t.categories.map((c) =>
                                                                        c.id === category.id
                                                                          ? {
                                                                              ...c,
                                                                              services: c.services.map((s) =>
                                                                                s.id === service.id
                                                                                  ? {
                                                                                      ...s,
                                                                                      price: value,
                                                                                      totalPrice: s.days * s.quantity * value
                                                                                    }
                                                                                  : s
                                                                              )
                                                                            }
                                                                          : c
                                                                      ),
                                                                    }
                                                                  : t
                                                              )
                                                            );
                                                          }}
                                                          className="w-full py-1.5 px-3 text-sm border rounded"
                                                        />
                                                      </div>
                                                      <div className="w-32">
                                                        <div className="text-xs text-gray-500 mb-1.5 text-right">Toplam</div>
                                                        <div className="text-sm font-medium text-right">
                                                          {service.totalPrice.toLocaleString('tr-TR', {
                                                            style: 'currency',
                                                            currency: 'TRY'
                                                          })}
                                                        </div>
                                                      </div>
                                                      <div className="flex flex-col">
                                                        <div className="text-xs text-gray-500 mb-1.5 invisible">Aksiyon</div>
                                                        <button
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            setTopics(
                                                              topics.map((t) =>
                                                                t.id === topic.id
                                                                  ? {
                                                                      ...t,
                                                                      categories: t.categories.map((c) =>
                                                                        c.id === category.id
                                                                          ? {
                                                                              ...c,
                                                                              services: c.services.filter(
                                                                                (s) => s.id !== service.id
                                                                              ),
                                                                            }
                                                                          : c
                                                                      ),
                                                                    }
                                                                  : t
                                                              )
                                                            );
                                                          }}
                                                          className="text-red-500 hover:text-red-600 text-xs"
                                                        >
                                                          Sil
                                                        </button>
                                                      </div>
                                                    </div>
                                                  )}
                                                </Draggable>
                                              ))}
                                              {provided.placeholder}
                                            </div>
                                          )}
                                        </Droppable>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Kategori Ekleme */}
                        <div className="mt-4 pb-2 space-y-2">
                          <div className="flex items-center gap-4 pl-6">
                            <select
                              value={selectedCategories[topic.id] || ''}
                              onChange={(e) => {
                                const selectedCategory = rateCards
                                  .find((rc) => rc.id === selectedRateCard)
                                  ?.categories.find((c) => c.id === e.target.value)

                                if (selectedCategory) {
                                  setTopics(
                                    topics.map((t) =>
                                      t.id === topic.id
                                        ? {
                                            ...t,
                                            categories: [
                                              ...t.categories,
                                              {
                                                ...selectedCategory,
                                                id: Date.now().toString(),
                                                services: []
                                              }
                                            ]
                                          }
                                        : t
                                    )
                                  )
                                  setSelectedCategories({
                                    ...selectedCategories,
                                    [topic.id]: ''
                                  })
                                }
                              }}
                              className="w-96 py-1.5 px-3 text-sm border rounded"
                            >
                              <option value="">Rate Card'dan Kategori Seç</option>
                              {selectedRateCard &&
                                rateCards
                                  .find((rc) => rc.id === selectedRateCard)
                                  ?.categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.name}
                                    </option>
                                  ))}
                            </select>

                            <input
                              type="text"
                              value={newCategoryNames[topic.id] || ''}
                              onChange={(e) =>
                                setNewCategoryNames({
                                  ...newCategoryNames,
                                  [topic.id]: e.target.value
                                })
                              }
                              placeholder="Yeni Kategori Adı"
                              className="w-96 py-1.5 px-3 text-sm border rounded"
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                addCustomCategory(topic.id);
                              }}
                              className="px-4 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Ekle
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Konu Ekleme */}
      <div className="mt-4">
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
          Konu Ekle
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="topic"
            value={currentTopic}
            onChange={(e) => setCurrentTopic(e.target.value)}
            placeholder="Konu Başlığı"
            className="flex-1 py-1.5 px-3 text-sm border rounded"
          />
          <button
            type="button"
            onClick={addTopic}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Ekle
          </button>
        </div>
      </div>

      {/* Genel Toplam */}
      <div className="mt-4 py-2 px-3 bg-gray-100 rounded-lg">
        <p className="text-base font-bold text-right">
          Genel Toplam:{' '}
          {topics.reduce((total, topic) => total + calculateTopicTotal(topic), 0).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY'
          })}
        </p>
      </div>
      <div className="h-8"></div>
    </div>
  )
} 