"use client"
import { useCallback, useEffect, useState } from "react"
import s from "./claimsPage.module.css"
import { BriefcaseBusiness, House, Locate } from 'lucide-react';
import { useDropzone } from "react-dropzone"
import { useAuth } from "@/lib/AuthContext"
import Link from "next/link"

export default function ClaimsClientPage(
  {currentDisasters} : 
  {currentDisasters: string[]}
) {
  const [step, setStep] = useState(0);
  /* 
  step 0: select disaster
  step 1: choose impact type
  step 2: upload evidence
  step 3: analyse evidence
  */
  const MAX_STEP = 3

  const [disaster, setDisaster] = useState<null | string>(null);
  const [impact, setImpact] = useState<null | string>(null);
  const [gps, setGPS] = useState<null | string>(null);
  const [image, setImage] = useState<null | string>(null);


  function selectDisaster(d: string) {
    setDisaster(d);
  }

  function decrementStep() {
    if (step >= 1) {
      setStep(prev => prev - 1);
    }
  }

  function incrementStep() {
    if (step < MAX_STEP) {
      setStep(prev => prev + 1);
    }
  }

  useEffect(() => {
    if (disaster && step == 0) {
      setStep(1);
    }
  }, [disaster])

  useEffect(() => {
    if (impact && step == 1) {
      setStep(2);
    }
  }, [impact])

  // useEffect(() => {
  //   if (image && step == 2) {
  //     setStep(3);
  //   }
  // }, [image])

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.readAsDataURL(file)

      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const base64 = await fileToBase64(acceptedFiles[0])
    setImage(base64)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": []
    },
    maxFiles: 1
  })

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [amount, setAmount] = useState("50");
  const [description, setDescription] = useState("");

  const { user } = useAuth();

  async function handleSubmit() {
    if (!user) return;
    setIsSubmitting(true);
    setStep(3);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          amount,
          description,
          reliefFund: disaster,
          wagerTitle: "Community Relief Claim",
          claimantWallet: user.walletAddress || "test.wallet.near",
          disaster_info: {
            name: disaster,
            date: new Date().toISOString().split('T')[0],
            details: description,
            location: "Singapore"
          },
          selected_category: impact?.toUpperCase(),
          category_details: {
            [impact || "other"]: {
              geotagged_media: image,
              evidence_url: image
            }
          }
        })
      });

      const data = await res.json();
      if (data.verification) {
        setVerificationResult(data.verification.verification_results);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={s.claimsPage}>
      <h1>Submit a claim</h1>
      <div className={s.stepFrame}>
        {step === 0 && 
          <div className={s.activeDisaster}>
            <h2 className={s.header}>Select active disaster</h2>
            <div className={s.disasterList}>
              {currentDisasters.map((d) => <div key={d} onClick={() => setDisaster(d)} className={s.listItem}>{d}</div>)}
            </div>
          </div>
        }
        {step === 1 && 
          <div className={s.impactType}>
            <h2 className={s.header}>Choose Impact Type</h2>
            <div className={s.impactList}>
              <div onClick={() => setImpact("property")} className={s.impactItem}>
                <House />
                Property
              </div>
              <div onClick={() => setImpact("presence")} className={s.impactItem}>
                <Locate />
                Presence
              </div>
              <div onClick={() => setImpact("livelihood")} className={s.impactItem}>
                <BriefcaseBusiness />
                Livelihood
              </div>
            </div>
            <div className={s.amountInput}>
              <label>Amount Requested ($)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className={s.inputField}
              />
            </div>
            <div className={s.descInput}>
              <label>Description of impact</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className={s.textField}
                placeholder="Describe how you were affected..."
              />
            </div>
          </div>
        }
        {step === 2 && (
          <div className={s.uploadEvidence}>
            <h2 className={s.header}>Upload Evidence</h2>

            <div {...getRootProps()} className={s.evidence}>
              <input {...getInputProps()} />

              {isDragActive ? (
                <p>Drop the image here…</p>
              ) : (
                <p>Drag & drop an image here, or click to select</p>
              )}
            </div>

            {image && (
              <div className={s.preview}>
                <h3>Preview</h3>
                <img src={image} alt="evidence" className={s.previewImage} />
              </div>
            )}
          </div>
        )}
        {step === 3 && (
          <div className={s.analyseEvidence}>
            <h2 className={s.header}>{isSubmitting ? "Verifying Claim..." : "Verification Result"}</h2>
            
            {isSubmitting ? (
              <div className={s.loadingContainer}>
                <div className={s.spinner}></div>
                <p>Gemini AI is auditing your claim manifest...</p>
              </div>
            ) : verificationResult ? (
              <div className={s.resultsLayout}>
                <div className={s.scoreCircle}>
                  <div className={s.scoreVal}>{verificationResult.calculated_score}</div>
                  <div className={s.scoreLabel}>AI Confidence</div>
                </div>
                
                <div className={s.resultsDetails}>
                  <div className={s.resultRow}>
                    <span>Triage Tier:</span>
                    <span className={s.resultVal}>Tier {verificationResult.triage_tier}</span>
                  </div>
                  <div className={s.resultRow}>
                    <span>Status:</span>
                    <span className={s.resultVal}>{verificationResult.disbursement.status}</span>
                  </div>
                  <div className={s.resultRow}>
                    <span>Payout:</span>
                    <span className={s.resultVal}>{verificationResult.disbursement.payout_percentage}%</span>
                  </div>
                </div>

                <div className={s.aiAnalysis}>
                  <h3>AI Analysis Explanation</h3>
                  <div className={s.analysisText}>
                    {verificationResult.analysis_explanation}
                  </div>
                </div>

                <div className={s.actionBox}>
                  <Link href="/dashboard" className="button-solid">Back to Portfolio</Link>
                  <button onClick={() => setShowRaw(!showRaw)} className={s.toggleRaw}>
                    {showRaw ? "Hide Raw AI Output" : "Show Raw AI Output"}
                  </button>
                </div>

                {showRaw && (
                  <div className={s.rawOutput}>
                    <pre>{JSON.stringify(verificationResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <p>Failed to retrieve verification result. Please check your dashboard.</p>
            )}
          </div>
        )}
      </div>
      <div className={s.buttonBox}>
        {step < 3 && (
          <>
            <button onClick={decrementStep} className="button-solid">
              Previous
            </button>
            {step === 2 ? (
              <button 
                onClick={handleSubmit} 
                className="button-solid" 
                disabled={!image || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Claim"}
              </button>
            ) : (
              <button 
                onClick={incrementStep} 
                className="button-solid" 
                disabled={step === 0 && !disaster || step === 1 && !impact}
              >
                Next
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

