import { useState, useEffect } from 'react';
import { FiX, FiImage, FiPlus, FiMinus } from 'react-icons/fi';
import { fetchSports } from '@/lib/server-apis/view-turfs/fetchSports-api';
import { fetchTeamSizes } from '@/lib/server-apis/view-turfs/fetchTeamSizes-api';
import Image from 'next/image';

interface CreateTurfModalProps {
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  organizationId: string;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const CreateTurfModal: React.FC<CreateTurfModalProps> = ({ onClose, onSubmit, organizationId }) => {
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState('');
  const [sports, setSports] = useState<{ _id: string; name: string }[]>([]);
  const [teamSizes, setTeamSizes] = useState<{ _id: string; name: number }[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [operatingHours, setOperatingHours] = useState(
    DAYS_OF_WEEK.map((day, index) => ({
      day: index,
      open: '09:00',
      close: '21:00',
    }))
  );

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [sportsData, teamSizesData] = await Promise.all([
          fetchSports(),
          fetchTeamSizes()
        ]);
        setSports(sportsData);
        setTeamSizes(teamSizesData);
      } catch (error) {
        console.error("Failed to load form options:", error);
      }
    };

    fetchOptions();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setImages([...images, ...filesArray]);

      // Create image previews
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    
    newImages.splice(index, 1);
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleHourChange = (dayIndex: number, field: 'open' | 'close', value: string) => {
    const updatedHours = [...operatingHours];
    updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
    setOperatingHours(updatedHours);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !basePrice || selectedSports.length === 0 || !teamSize) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('organization', organizationId);
      formData.append('name', name);
      formData.append('basePrice', basePrice);
      formData.append('sports', JSON.stringify(selectedSports));
      formData.append('team_size', teamSize);
      formData.append('operatingHours', JSON.stringify(operatingHours));
      
      // Add images
      images.forEach(image => {
        formData.append('images', image);
      });
      
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Create New Turf</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turf Name*
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter turf name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price (per hour)*
              </label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter base price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Size*
              </label>
              <select
                required
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select team size</option>
                {teamSizes.map(size => (
                  <option key={size._id} value={size.name}>
                    {size.name} vs {size.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sports Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Sports*</h3>
            <div className="flex flex-wrap gap-2">
              {sports.map(sport => (
                <button
                  type="button"
                  key={sport._id}
                  onClick={() => toggleSport(sport.name)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    selectedSports.includes(sport.name)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {sport.name}
                </button>
              ))}
            </div>
            {selectedSports.length === 0 && (
              <p className="text-sm text-red-500">Please select at least one sport</p>
            )}
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Operating Hours</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DAYS_OF_WEEK.map((day, index) => (
                <div key={day} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{day}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={operatingHours[index].open}
                      onChange={(e) => handleHourChange(index, 'open', e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={operatingHours[index].close}
                      onChange={(e) => handleHourChange(index, 'close', e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Turf Images</h3>
            
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative h-24 w-24">
                  <Image
                    src={preview}
                    alt={`Preview ${index}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full"
                    title="Remove image"
                  >
                    <FiMinus size={14} />
                  </button>
                </div>
              ))}
              
              <label className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <FiImage size={24} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Add Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Turf'}
              {loading ? null : <FiPlus />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTurfModal;