import React, { useState, useEffect } from 'react';
import {
    IoSaveOutline, IoAddOutline, IoTrashOutline, IoBusinessOutline,
    IoTimeOutline, IoGlobeOutline, IoMailOutline, IoCallOutline
} from 'react-icons/io5';
import * as settingsApi from '../src/api/settings';
import { useToast } from '../src/components/Toast';

interface ServiceTime {
    id: string;
    day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
    time: string;
    name: string;
}


const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const SettingsPageNew: React.FC = () => {
    const { showSuccess, showError } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
        denomination: '',
        weeklyAttendance: '',
        timezone: 'America/New_York',
        memberTerm: 'Church Member',
        autoWelcome: false,
    });

    const [serviceTimes, setServiceTimes] = useState<ServiceTime[]>([]);
    const [newService, setNewService] = useState({
        day: 'SUNDAY' as const,
        time: '09:00',
        name: '',
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await settingsApi.getSettings();
            setFormData({
                name: data.name,
                email: data.email,
                phone: data.phone,
                website: data.website || '',
                address: data.address,
                city: data.city,
                state: data.state,
                zip: data.zip,
                country: data.country,
                denomination: data.denomination || '',
                weeklyAttendance: data.weeklyAttendance || '',
                timezone: data.timezone,
                memberTerm: data.memberTerm,
                autoWelcome: data.autoWelcome,
            });
            setServiceTimes(data.serviceTimes);
        } catch (error) {
            showError('Failed to load settings');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const updateData = {
                ...formData,
                serviceTimes: serviceTimes.map(st => ({
                    day: st.day,
                    time: st.time,
                    name: st.name,
                })),
            };

            await settingsApi.updateSettings(updateData);
            showSuccess('Settings saved successfully');
            loadSettings();
        } catch (error) {
            showError('Failed to save settings');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddServiceTime = () => {
        if (!newService.time || !newService.name) {
            showError('Please fill in all service time fields');
            return;
        }

        const newServiceTime: ServiceTime = {
            id: `temp-${Date.now()}`,
            ...newService,
        };

        setServiceTimes([...serviceTimes, newServiceTime]);
        setNewService({ day: 'SUNDAY', time: '', name: '' });
    };

    const handleDeleteServiceTime = (id: string) => {
        setServiceTimes(serviceTimes.filter(st => st.id !== id));
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <LoadingSkeleton />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <IoBusinessOutline className="text-blue-600" />
                    Church Settings
                </h1>
                <p className="text-gray-600 mt-2">Manage your church information and configuration</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <IoBusinessOutline className="text-gray-600" />
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Church Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Denomination
                            </label>
                            <input
                                type="text"
                                name="denomination"
                                value={formData.denomination}
                                onChange={handleInputChange}
                                placeholder="e.g., Baptist, Methodist, Non-denominational"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <IoMailOutline />
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <IoCallOutline />
                                Phone *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <IoGlobeOutline />
                                Website
                            </label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                placeholder="https://yourchurch.org"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                        Address
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Street Address *
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State *
                                </label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ZIP Code *
                                </label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Times */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <IoTimeOutline className="text-gray-600" />
                        Service Times
                    </h2>

                    <div className="space-y-4 mb-6">
                        {serviceTimes.map((service) => (
                            <div key={service.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    <div className="font-medium text-gray-700">{service.day}</div>
                                    <div className="text-gray-600">{service.time}</div>
                                    <div className="text-gray-800">{service.name}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteServiceTime(service.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <IoTrashOutline size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Day
                            </label>
                            <select
                                value={newService.day}
                                onChange={(e) => setNewService({ ...newService, day: e.target.value as any })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="SUNDAY">Sunday</option>
                                <option value="MONDAY">Monday</option>
                                <option value="TUESDAY">Tuesday</option>
                                <option value="WEDNESDAY">Wednesday</option>
                                <option value="THURSDAY">Thursday</option>
                                <option value="FRIDAY">Friday</option>
                                <option value="SATURDAY">Saturday</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time
                            </label>
                            <input
                                type="time"
                                value={newService.time}
                                onChange={(e) => setNewService({ ...newService, time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Name
                            </label>
                            <input
                                type="text"
                                value={newService.name}
                                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                placeholder="e.g., Morning Worship"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleAddServiceTime}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            <IoAddOutline size={20} />
                            Add
                        </button>
                    </div>
                </div>

                {/* Additional Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                        Additional Settings
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Weekly Attendance
                            </label>
                            <input
                                type="text"
                                name="weeklyAttendance"
                                value={formData.weeklyAttendance}
                                onChange={handleInputChange}
                                placeholder="e.g., 200-300"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Member Term
                            </label>
                            <input
                                type="text"
                                name="memberTerm"
                                value={formData.memberTerm}
                                onChange={handleInputChange}
                                placeholder="e.g., Church Member, Partner"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Timezone
                            </label>
                            <select
                                name="timezone"
                                value={formData.timezone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Chicago">Central Time</option>
                                <option value="America/Denver">Mountain Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="America/Anchorage">Alaska Time</option>
                                <option value="Pacific/Honolulu">Hawaii Time</option>
                            </select>
                        </div>

                        <div className="flex items-center pt-8">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="autoWelcome"
                                    checked={formData.autoWelcome}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                    Auto-send welcome emails to new members
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        <IoSaveOutline size={20} />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPageNew;
