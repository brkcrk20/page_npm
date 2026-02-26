import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useUserBilling() {
  const [hasBillingInfo, setHasBillingInfo] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBilling = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          // billingInfo alanı var mı ve dolu mu kontrolü
          setHasBillingInfo(!!data.billingInfo);
        }
      }
      setLoading(false);
    };

    checkBilling();
  }, []);

  return { hasBillingInfo, loading };
}