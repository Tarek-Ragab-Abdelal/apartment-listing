'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apartmentApi, citiesApi, projectsApi, City, Project } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ImageIcon, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  isUploading?: boolean;
}

const NewListing = () => {
  const [formData, setFormData] = useState({
    unitName: '',
    projectId: '',
    cityId: '',
    bedrooms: '',
    bathrooms: '',
    areaSqm: '',
    priceEgp: '',
    address: '',
    description: '',
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload JPG, PNG, or WebP images only.',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload images smaller than 5MB.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (validFiles.length === 0) return;

    // Check total images limit
    if (uploadedImages.length + validFiles.length > 10) {
      toast({
        title: 'Too many images',
        description: 'Maximum 10 images allowed per listing.',
        variant: 'destructive',
      });
      return;
    }

    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      preview: URL.createObjectURL(file),
      isUploading: true,
    }));

    setUploadedImages(prev => [...prev, ...newImages]);

    // Simulate upload process and show toast
    setTimeout(() => {
      setUploadedImages(prev => prev.map(img => ({ ...img, isUploading: false })));
      
      toast({
        title: 'Images uploaded',
        description: 'Note: Placeholder images will be used in the actual listing for demo purposes.',
        variant: 'default',
      });
    }, 1500);
  }, [uploadedImages.length, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const validateFormData = () => {
    const errors: string[] = [];

    if (!formData.unitName.trim()) {
      errors.push('Unit Name is required.');
    }

    if (!formData.projectId.trim() || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(formData.projectId)) {
      errors.push('Project ID must be a valid UUID.');
    }

    if (!formData.priceEgp || Number.isNaN(Number(formData.priceEgp)) || Number(formData.priceEgp) <= 0) {
      errors.push('Price must be a positive number.');
    }

    if (formData.bedrooms && (Number.isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0)) {
      errors.push('Bedrooms must be a non-negative number.');
    }

    if (formData.bathrooms && (Number.isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0)) {
      errors.push('Bathrooms must be a non-negative number.');
    }

    if (formData.areaSqm && (Number.isNaN(Number(formData.areaSqm)) || Number(formData.areaSqm) <= 0)) {
      errors.push('Area must be a positive number.');
    }

    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors.join(' '),
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to create a listing',
        variant: 'destructive',
      });
      router.push('/login');
    }
  }, [user, router, toast]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      for (const img of uploadedImages) {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      }
    };
  }, []);

  // Prevent default drag behaviors on the document
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    
    document.addEventListener('dragover', preventDefault);
    document.addEventListener('drop', preventDefault);
    
    return () => {
      document.removeEventListener('dragover', preventDefault);
      document.removeEventListener('drop', preventDefault);
    };
  }, []);

  // Fetch cities and projects
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await citiesApi.getAll();
        setCities(response.data);
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    };

    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getAll();
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchCities();
    fetchProjects();
  }, []);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Project name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await projectsApi.create({
        name: newProjectName,
        cityId: formData.cityId,
      });
      setProjects((prev) => [...prev, response.data]);
      setFormData((prev) => ({ ...prev, projectId: response.data.id }));
      setNewProjectName('');
      toast({
        title: 'Success',
        description: 'Project added successfully.',
      });
    } catch (error) {
      console.error('Failed to add project:', error);
      toast({
        title: 'Error',
        description: 'Failed to add project. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFormData()) {
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to create a listing',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await apartmentApi.create({
        unitName: formData.unitName,
        projectId: formData.projectId,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        areaSqm: formData.areaSqm ? Number(formData.areaSqm) : undefined,
        priceEgp: Number(formData.priceEgp),
        address: formData.address,
        description: formData.description,
        listerId: user.id,
        status: 'ACTIVE',
      });

      toast({
        title: 'Success',
        description: 'Apartment listing created successfully',
      });
      
      // Cleanup object URLs
      for (const img of uploadedImages) {
        URL.revokeObjectURL(img.preview);
      }
      
      router.push('/');
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create listing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderDropdown = (options: { value: string; label: string }[], value: string, onChange: (value: string) => void, placeholder: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full px-4 py-2 border rounded-md text-left">
        {value ? options.find(option => option.value === value)?.label : placeholder}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        {options.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="cursor-pointer px-4 py-2 hover:bg-gray-100"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Add New Apartment Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="unitName">Unit Name *</Label>
                <Input
                  id="unitName"
                  placeholder="e.g., Apartment 101"
                  value={formData.unitName}
                  onChange={(e) => handleChange('unitName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cityId">City *</Label>
                {renderDropdown(
                  cities.map(city => ({ value: city.id, label: city.name })),
                  formData.cityId,
                  value => handleChange('cityId', value),
                  'Select a city'
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <div className="flex items-center gap-2">
                  {renderDropdown(
                    projects.map(project => ({ value: project.id, label: project.name })),
                    formData.projectId,
                    value => handleChange('projectId', value),
                    'Select a project'
                  )}
                  <Input
                    placeholder="New project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddProject}>
                    Add Project
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., New Cairo, Egypt"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    placeholder="e.g., 2"
                    value={formData.bathrooms}
                    onChange={(e) => handleChange('bathrooms', e.target.value)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaSqm">Area (sqm)</Label>
                  <Input
                    id="areaSqm"
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.areaSqm}
                    onChange={(e) => handleChange('areaSqm', e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceEgp">Price (EGP) *</Label>
                <Input
                  id="priceEgp"
                  type="number"
                  placeholder="e.g., 4500000"
                  value={formData.priceEgp}
                  onChange={(e) => handleChange('priceEgp', e.target.value)}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the apartment features, amenities, location benefits..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Property Images</Label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Drag & Drop Area */}
                <button
                  type="button"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={openFileDialog}
                  aria-label="Upload apartment images by clicking or dragging files here"
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full",
                    isDragOver 
                      ? "border-primary bg-primary/5 scale-[1.02]" 
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                      "p-4 rounded-full transition-colors",
                      isDragOver ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Upload className={cn(
                        "w-8 h-8 transition-colors",
                        isDragOver ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        {isDragOver ? "Drop images here" : "Upload apartment images"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Drag and drop images here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports: JPG, PNG, WebP • Max size: 5MB • Max: 10 images
                      </p>
                    </div>
                  </div>
                </button>

                {/* Image Preview Grid */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={image.preview}
                            alt="Preview"
                            className={cn(
                              "w-full h-full object-cover transition-opacity",
                              image.isUploading ? "opacity-50" : "opacity-100"
                            )}
                          />
                          {image.isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(image.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {image.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add More Images Button */}
                {uploadedImages.length > 0 && uploadedImages.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openFileDialog}
                    className="w-full mt-4"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add More Images ({uploadedImages.length}/10)
                  </Button>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Listing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewListing;
