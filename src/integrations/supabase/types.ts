export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      levels: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      school_classes: {
        Row: {
          id: string
          name: string
          department_id: string
          level_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          department_id: string
          level_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          department_id?: string
          level_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          name: string
          author: string
          category: string
          total_copy: number
          available_copy: number
          cover_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          author: string
          category: string
          total_copy?: number
          available_copy?: number
          cover_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          author?: string
          category?: string
          total_copy?: number
          available_copy?: number
          cover_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          full_name: string
          department: string
          level: string
          class: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          department: string
          level: string
          class: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          department?: string
          level?: string
          class?: string
          created_at?: string
          updated_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          subject: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          phone?: string | null
          subject?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          subject?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      borrow_records: {
        Row: {
          id: string
          book_id: string
          book_name: string
          borrower_type: string
          borrower_id: string
          borrower_name: string
          quantity: number
          borrow_date: string
          return_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          book_name: string
          borrower_type: string
          borrower_id: string
          borrower_name: string
          quantity?: number
          borrow_date: string
          return_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          book_name?: string
          borrower_type?: string
          borrower_id?: string
          borrower_name?: string
          quantity?: number
          borrow_date?: string
          return_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      stock_items: {
        Row: {
          id: string
          name: string
          quantity: number
          low_stock_qty: number
          added_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          quantity?: number
          low_stock_qty?: number
          added_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          quantity?: number
          low_stock_qty?: number
          added_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          item_id: string
          item_name: string
          type: string
          quantity: number
          supplier_name: string | null
          taken_by: string | null
          price_per_unit: number | null
          date: string
          added_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          item_name: string
          type: string
          quantity: number
          supplier_name?: string | null
          taken_by?: string | null
          price_per_unit?: number | null
          date: string
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          item_name?: string
          type?: string
          quantity?: number
          supplier_name?: string | null
          taken_by?: string | null
          price_per_unit?: number | null
          date?: string
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      account_records: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          phone: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          email: string
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          email?: string
          phone?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "librarian" | "stock_manager"
      borrow_status: "borrowed" | "returned" | "overdue"
      movement_type: "in" | "out"
    }
  }
}