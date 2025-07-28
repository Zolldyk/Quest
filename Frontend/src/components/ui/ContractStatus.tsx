'use client';

import { useContractValidation } from '../../hooks/useContracts';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Component to display contract configuration status
 */
export default function ContractStatus() {
  const { isValid, missingAddresses, addresses } = useContractValidation();

  if (isValid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-sm text-green-800 font-medium">
            All contracts configured
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Contract Configuration Issues
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            Some contract addresses are missing. This may cause features to not work properly.
          </p>
          
          <div className="space-y-2">
            <p className="text-xs text-yellow-700 font-medium">Missing addresses:</p>
            <ul className="text-xs text-yellow-600 list-disc list-inside space-y-1">
              {missingAddresses.map(addr => (
                <li key={addr}>{addr}</li>
              ))}
            </ul>
          </div>
          
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <p className="text-xs text-yellow-600">
              Please check your environment configuration or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}