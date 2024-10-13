import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Card, CardStatus } from "@/types/card";
import { Edit, Plus, X } from "lucide-react";
import { useState } from "react";

interface CardTableProps {
  cards: Card[];
  setEditingCard: (card: Card | null) => void;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  setIsEditStatusDialogOpen: (isOpen: boolean) => void;
  setIsChangePinDialogOpen: (isOpen: boolean) => void;
  handleBlockCard: (card: Card) => void;
  unBlockCard: (card: Card) => void;
}

const formatCardNumber = (cardNo: string): string => {
  return cardNo.replace(/(.{4})/g, "$1 ").trim();
};

export const CardTable: React.FC<CardTableProps> = ({
  cards,
  setEditingCard,
  setIsEditDialogOpen,
  setIsEditStatusDialogOpen,
  setIsChangePinDialogOpen,
  handleBlockCard,
  unBlockCard,
}) => {
  const [revealedCard, setRevealedCard] = useState<string | null>(null);

  const toggleRevealCard = (cardNo: string) => {
    setRevealedCard((prev) => (prev === cardNo ? null : cardNo));
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Card Number</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cards.map((card) => (
          <TableRow key={card.cardNo}>
            <TableCell onClick={() => toggleRevealCard(card.cardNo)} className="cursor-pointer">
              {revealedCard === card.cardNo ? formatCardNumber(card.cardNo) : `**** **** **** ${card.cardNo.slice(-4)}`}
            </TableCell>
            <TableCell>{card.cardType}</TableCell>
            <TableCell>{card.cardCategory}</TableCell>
            <TableCell>{card.status}</TableCell>
            <TableCell>{card.validTill}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCard(card);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCard(card);
                    setIsEditStatusDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCard(card);
                    setIsChangePinDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> PIN
                </Button>
                {card.status !== CardStatus.BLOCKED ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBlockCard(card)}
                  >
                    <X className="mr-2 h-4 w-4" /> Block
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unBlockCard(card)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Unblock
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};