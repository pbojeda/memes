'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AddressForm } from '@/components/address/AddressForm';
import { addressService } from '@/lib/services/addressService';
import type { components } from '@/lib/api/types';

type Address = components['schemas']['Address'];

export interface AddressSelectorProps {
  onSelect: (address: Address) => void;
}

export function AddressSelector({ onSelect }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await addressService.list();
      setAddresses(data);

      // Auto-select default address if exists
      const defaultAddress = data.find((addr) => addr.isDefault);
      if (defaultAddress && defaultAddress.id) {
        setSelectedId(defaultAddress.id);
        onSelect(defaultAddress);
      }
    } catch (err) {
      setError('Failed to load addresses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddressClick = (address: Address) => {
    if (address.id) {
      setSelectedId(address.id);
      onSelect(address);
    }
  };

  const handleFormSuccess = (newAddress: Address) => {
    setAddresses((prev) => [...prev, newAddress]);
    if (newAddress.id) {
      setSelectedId(newAddress.id);
      onSelect(newAddress);
    }
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleAddNewAddress = () => {
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Shipping Address</h2>
        <p>Loading addresses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Shipping Address</h2>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadAddresses}>Retry</Button>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Shipping Address</h2>
        <AddressForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Shipping Address</h2>
        <p className="text-muted-foreground">No saved addresses found.</p>
        <Button onClick={handleAddNewAddress}>Add New Address</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shipping Address</h2>
      <div className="space-y-3">
        {addresses.map((address) => (
          <button
            key={address.id}
            onClick={() => handleAddressClick(address)}
            className="w-full text-left"
          >
            <Card
              className={
                selectedId === address.id
                  ? 'ring-2 ring-primary'
                  : 'hover:border-primary/50 transition-colors'
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.streetLine1}</p>
                    {address.streetLine2 && (
                      <p className="text-sm text-muted-foreground">{address.streetLine2}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {address.city}
                      {address.state && `, ${address.state}`} {address.postalCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.countryCode}</p>
                  </div>
                  {address.isDefault && (
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      <Button variant="outline" onClick={handleAddNewAddress}>
        Add New Address
      </Button>
    </div>
  );
}
