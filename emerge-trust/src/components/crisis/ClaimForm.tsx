import { useState, useRef } from "react";
import { Camera, MapPin, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/store/appState";
import { saveClaimOffline } from "@/lib/indexedDB";
import type { GeoPoint, Claim } from "@/types";

interface ClaimFormProps {
  zoneId: string;
  onSubmitted?: (claimId: string) => void;
}

function ClaimForm({ zoneId, onSubmitted }: ClaimFormProps) {
  const { user } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [geoLocation, setGeoLocation] = useState<GeoPoint | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const captureGeoLocation = () => {
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsGeoLoading(false);
      },
      () => {
        setError("Could not get location. Please allow location access.");
        setIsGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!user || !photoFile || !geoLocation || !amount) return;

    setIsSubmitting(true);
    setError(null);

    const requestedAmount = Math.round(parseFloat(amount) * 100);
    const tier1Amount = Math.round(requestedAmount * 0.2);
    const tier2Amount = requestedAmount - tier1Amount;

    const claimPayload: Omit<Claim, "id" | "status" | "createdAt" | "updatedAt"> = {
      type: "individual",
      userId: user.uid,
      zoneId,
      requestedAmount,
      tier1Amount,
      tier2Amount,
      photoUrl: null, // Will be set server-side after upload
      geoLocation,
      proofOfDistributionUrl: null,
      votingDeadlineAt: null,
    };

    if (!navigator.onLine) {
      const localId = await saveClaimOffline(claimPayload);
      onSubmitted?.(localId);
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      formData.append("claim", JSON.stringify(claimPayload));

      const res = await fetch("/api/claims", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { claimId } = await res.json();
      onSubmitted?.(claimId);
    } catch {
      // Save offline as fallback
      const localId = await saveClaimOffline(claimPayload);
      onSubmitted?.(localId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Photo capture */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoCapture}
          aria-label="Capture photo evidence"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full min-h-[180px] rounded-2xl border-2 border-dashed border-cr-orange/60 bg-cr-surface flex flex-col items-center justify-center gap-3 active:bg-cr-panel transition-colors"
          aria-label="Take or upload photo evidence"
        >
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Evidence preview"
              className="w-full h-48 object-cover rounded-xl"
            />
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-cr-orange/10 flex items-center justify-center">
                <Camera size={32} className="text-cr-orange" />
              </div>
              <p className="text-cr-text font-bold text-lg">
                Take Photo Evidence
              </p>
              <p className="text-cr-muted text-sm">
                Tap to capture or upload
              </p>
            </>
          )}
        </button>
      </div>

      {/* Geo location */}
      <Button
        variant={geoLocation ? "secondary" : "primary"}
        size="lg"
        className="w-full"
        onClick={captureGeoLocation}
        isLoading={isGeoLoading}
      >
        <MapPin size={18} className="mr-2" />
        {geoLocation
          ? `Location: ${geoLocation.lat.toFixed(4)}, ${geoLocation.lng.toFixed(4)}`
          : "Capture GPS Location"}
      </Button>

      {/* Amount */}
      <div>
        <label className="block text-cr-muted text-xs mb-2 uppercase tracking-wider font-medium">
          Amount Requested (SGD)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0.01"
          step="0.01"
          className="w-full bg-cr-surface border border-cr-orange/40 rounded-xl px-4 py-4 text-cr-text text-xl font-bold placeholder:text-cr-muted focus:outline-none focus:border-cr-orange transition-colors"
          aria-label="Requested amount in SGD"
        />
        {amount && (
          <p className="text-cr-muted text-xs mt-2 px-1">
            20% ({parseFloat(amount) * 0.2 || 0} SGD) released instantly &bull;
            80% pending community vote
          </p>
        )}
      </div>

      {error && (
        <p className="text-cr-red text-sm font-medium" role="alert">
          {error}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={!photoFile || !geoLocation || !amount}
      >
        <Send size={18} className="mr-2" />
        Submit Claim
      </Button>

      <p className="text-cr-muted text-xs text-center">
        If offline, your claim will be saved and submitted automatically when
        reconnected.
      </p>
    </div>
  );
}

export default ClaimForm;
